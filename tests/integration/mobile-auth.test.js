import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';
import axios from 'axios';
import bcrypt from 'bcryptjs';

test('mobile verification and password recovery with an isolated SMS transport', {timeout: 120000}, async t => {
  const db = await MongoMemoryServer.create();
  Object.assign(process.env, {MONGO_URL: db.getUri(), JWT_SECRET: 'mobile-test-secret', NODE_ENV: 'test',
    TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'test-token', TWILIO_FROM_NUMBER: '+15550000000'});
  await mongoose.connect(process.env.MONGO_URL);
  const {default: User} = await import('../../models/user.js');
  const {default: Session} = await import('../../models/session.js');
  const {MobileOtp, MobileOtpBudget} = await import('../../models/mobileOtp.js');
  const {normalizePhone, issueMobileOtp, consumeMobileOtp} = await import('../../services/mobileOtp.js');
  await Promise.all([User.init(), MobileOtp.init(), MobileOtpBudget.init()]);
  const sent = [];
  let providerFails = false;
  t.mock.method(axios, 'post', async (url, body, options) => {
    assert.match(url, /^https:\/\/api\.twilio\.com\//);
    assert.equal(options.auth.password, 'test-token');
    if (providerFails) throw new Error('Provider error containing confidential data');
    const payload = new URLSearchParams(body);
    sent.push({phone: payload.get('To'), code: payload.get('Body').match(/code is (\d{6})/)[1]});
    return {data: {sid: 'SM-test', status: 'queued'}};
  });
  const {default: app} = await import('../../app.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => {server.close(resolve);server.closeAllConnections();}); await mongoose.disconnect(); await db.stop(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    const cookies = new Map();
    return async (path, body) => {
      const response = await fetch(base + path, {method: body ? 'POST' : 'GET', headers: {origin: base,
        cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...(body ? {'content-type': 'application/x-www-form-urlencoded'} : {})},
        ...(body ? {body: new URLSearchParams(body)} : {}), redirect: 'manual'});
      for (const value of response.headers.getSetCookie()) {const pair = value.split(';')[0];const index = pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}
      return response;
    };
  }
  const student = client(), anonymous = client();
  const signup = {username: 'Mobile learner', email: 'mobile@example.com', phone: '+91 98765 43210', verificationMethod: 'sms', password: 'MobilePass!2026', confirm: 'MobilePass!2026'};
  await t.test('normalizes international numbers and rejects ambiguous local input', () => {
    assert.equal(normalizePhone(signup.phone), '+919876543210');
    for (const value of ['9876543210', '+012345678', {phone:'x'}, '+91<script>']) assert.equal(normalizePhone(value), null);
  });
  await t.test('registration saves only a protected code and verifies the phone once', async () => {
    assert.equal((await student('/auth/register', signup)).status, 200);
    let user = await User.findOne({email: signup.email});
    assert.equal(user.verified, false); assert.equal(user.phone, undefined);
    const challenge = await MobileOtp.findOne({user:user._id});
    assert.notEqual(challenge.otpHash, sent.at(-1).code);
    assert.equal((await anonymous('/auth/mobile/verify', {otpEntered:sent.at(-1).code})).status, 302);
    assert.equal((await student('/auth/mobile/verify', {otpEntered:'000000'})).status, 400);
    assert.equal((await student('/auth/mobile/verify', {otpEntered:sent.at(-1).code})).status, 302);
    user = await User.findById(user._id); assert.equal(user.verified,true); assert.equal(user.phone,'+919876543210'); assert.ok(user.phoneVerifiedAt);
    assert.equal(await MobileOtp.countDocuments({user:user._id}),0);
    assert.equal((await student('/auth/mobile/verify', {otpEntered:sent.at(-1).code})).status,302);
    const before=sent.length; await anonymous('/auth/register',{...signup,email:'duplicate@example.com'}); assert.equal(sent.length,before);
  });
  await t.test('recovery hides account existence, revokes sessions and rejects reused codes', async () => {
    await student('/auth/login', {email:signup.email,password:signup.password});
    const unknown = await anonymous('/auth/forgot-password', {verificationMethod:'sms',phone:'+15551234567'});
    const recoveryClient = client();
    const recovery = await recoveryClient('/auth/forgot-password', {verificationMethod:'sms',phone:signup.phone});
    assert.equal(unknown.status,200); assert.equal(recovery.status,200);
    const clean = html => html.match(/<main[\s\S]*<\/main>/)[0].replace(/[a-f0-9]{64}/g,'TOKEN');
    assert.equal(clean(await unknown.text()),clean(await recovery.text()));
    const resetCode=sent.at(-1).code;
    const user=await User.findOne({email:signup.email}); assert.ok(await Session.exists({user:user._id,revoked:false}));
    assert.equal((await recoveryClient('/auth/reset-password/mobile',{otpEntered:resetCode,password:'NewMobile!2026',confirm:'NewMobile!2026'})).status,302);
    assert.ok(await bcrypt.compare('NewMobile!2026',(await User.findById(user._id)).password));
    assert.equal(await Session.countDocuments({user:user._id,revoked:false}),0);
    assert.equal((await student('/dashboard')).status,302);
    assert.equal((await recoveryClient('/auth/reset-password/mobile',{otpEntered:resetCode,password:'Reused!2026',confirm:'Reused!2026'})).status,302);
  });
  await t.test('codes enforce expiry, purpose, retry count, cooldown and hourly budget', async () => {
    const user=await User.findOne({email:signup.email}),phone='+15551230001';
    await issueMobileOtp({phone,purpose:'bind-phone',user:user._id}); const code=sent.at(-1).code;
    assert.equal(await consumeMobileOtp({phone,purpose:'reset-password',code}),null);
    await assert.rejects(issueMobileOtp({phone,purpose:'bind-phone',user:user._id}),/60 seconds/);
    for(let i=0;i<5;i++) assert.equal(await consumeMobileOtp({phone,purpose:'bind-phone',code:'000000'}),null);
    assert.equal(await consumeMobileOtp({phone,purpose:'bind-phone',code}),null);
    await MobileOtp.updateMany({phone},{$set:{attempts:0,expiresAt:new Date(Date.now()-1)}});
    assert.equal(await consumeMobileOtp({phone,purpose:'bind-phone',code}),null);
    const budgetPhone='+15551230002';
    for(let i=0;i<5;i++){await MobileOtp.updateMany({phone:budgetPhone},{$set:{lastSentAt:new Date(Date.now()-61000)}});await issueMobileOtp({phone:budgetPhone,purpose:'bind-phone',user:user._id});}
    await MobileOtp.updateMany({phone:budgetPhone},{$set:{lastSentAt:new Date(Date.now()-61000)}});
    await assert.rejects(issueMobileOtp({phone:budgetPhone,purpose:'bind-phone',user:user._id}),/Too many codes/);
  });
  await t.test('existing accounts can bind and replace numbers only after SMS proof', async () => {
    await student('/auth/login',{email:signup.email,password:'NewMobile!2026'});
    assert.equal((await student('/auth/mobile')).status,200);
    assert.equal((await student('/auth/mobile/send',{phone:'+15551230003'})).status,200);
    assert.equal((await User.findOne({email:signup.email})).phone,'+919876543210');
    assert.equal((await student('/auth/mobile/verify',{otpEntered:sent.at(-1).code})).status,302);
    assert.equal((await User.findOne({email:signup.email})).phone,'+15551230003');
  });
  await t.test('failed or unconfigured providers cannot activate codes', async () => {
    const user=await User.findOne({email:signup.email});providerFails=true;
    await assert.rejects(issueMobileOtp({phone:'+15551230004',purpose:'bind-phone',user:user._id}),/could not be sent/);
    assert.equal((await MobileOtp.findOne({phone:'+15551230004'})).active,false);
    delete process.env.TWILIO_AUTH_TOKEN;
    assert.equal((await anonymous('/auth/register',{...signup,email:'offline@example.com',phone:'+15551230005'})).status,503);
    assert.equal(await User.countDocuments({email:'offline@example.com'}),0);
  });
});

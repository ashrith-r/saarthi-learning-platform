import {createHmac, randomInt} from 'node:crypto';
import axios from 'axios';
import config from '../config/config.js';
import {MobileOtp, MobileOtpBudget} from '../models/mobileOtp.js';

export function normalizePhone(value) {
  if (typeof value !== 'string' || value.length > 40) return null;
  const phone = value.trim().replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

export function smsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM_NUMBER));
}

function digest(value) {
  return createHmac('sha256', config.JWT_SECRET).update(value).digest('hex');
}
function failure(message, status = 429) {
  return Object.assign(new Error(message), {status});
}

export async function issueMobileOtp({phone, purpose, user}) {
  if (!smsConfigured()) throw failure('SMS verification is temporarily unavailable. Try again later.', 503);
  if (!normalizePhone(phone)) throw failure('Enter a mobile number with its country code.', 400);
  const now = new Date();
  const key = digest(`${phone}:${purpose}`);
  if (await MobileOtp.exists({_id: key, lastSentAt: {$gt: new Date(now.getTime() - 60000)}})) {
    throw failure('Wait 60 seconds before requesting another code.');
  }
  // The shared database enforces limits across app restarts and server instances.
  const hour = Math.floor(now.getTime() / 3600000);
  try {
    await MobileOtpBudget.findOneAndUpdate({_id: digest(`${phone}:${hour}`), count: {$lt: 5}},
      {$inc: {count: 1}, $setOnInsert: {expiresAt: new Date((hour + 2) * 3600000)}}, {upsert: true});
  } catch (error) {
    if (error.code === 11000) throw failure('Too many codes requested. Try again in the next hour.');
    throw error;
  }
  const code = String(randomInt(100000, 1000000));
  let challenge;
  try {
    challenge = await MobileOtp.findOneAndUpdate({_id: key, lastSentAt: {$lte: new Date(now.getTime() - 60000)}},
      {$set: {phone, purpose, user, otpHash: digest(`${phone}:${purpose}:${code}`), attempts: 0,
        active: false, lastSentAt: now, expiresAt: new Date(now.getTime() + 600000)}}, {upsert: true, returnDocument: 'after'});
  } catch (error) {
    if (error.code === 11000) throw failure('Wait 60 seconds before requesting another code.');
    throw error;
  }
  const body = new URLSearchParams({To: phone,
    Body: `Your ${purpose === 'reset-password' ? 'password reset' : 'account verification'} code is ${code}. It expires in 10 minutes. Do not share this code.`});
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) body.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
  else body.set('From', process.env.TWILIO_FROM_NUMBER);
  try {
    const result = await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID)}/Messages.json`, body.toString(), {
      auth: {username: process.env.TWILIO_ACCOUNT_SID, password: process.env.TWILIO_AUTH_TOKEN},
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}, timeout: 15000, maxRedirects: 0
    });
    if (!result.data?.sid || ['failed', 'undelivered'].includes(result.data.status)) throw new Error('SMS rejected');
    await MobileOtp.updateOne({_id: key, otpHash: challenge.otpHash}, {$set: {active: true}});
  } catch {
    // Never log provider request objects: they contain credentials, phone numbers and the code.
    throw failure('The code could not be sent. Wait 60 seconds and try again.', 503);
  }
}

export async function consumeMobileOtp({phone, purpose, code, user}) {
  if (!normalizePhone(phone)) return null;
  const filter = {_id: digest(`${phone}:${purpose}`), active: true, expiresAt: {$gt: new Date()}, attempts: {$lt: 5}, ...(user ? {user} : {})};
  const entered = typeof code === 'string' && /^\d{6}$/.test(code) ? code : '';
  const challenge = await MobileOtp.findOneAndDelete({...filter, otpHash: digest(`${phone}:${purpose}:${entered}`)});
  if (!challenge) await MobileOtp.updateOne(filter, {$inc: {attempts: 1}});
  return challenge;
}

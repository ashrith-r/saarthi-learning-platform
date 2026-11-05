import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGO_URL ||= 'mongodb://127.0.0.1:27017/email-test';
process.env.JWT_SECRET ||= 'email-test-only-secret';
process.env.BREVO_API_KEY = 'test-only-provider-secret';
process.env.GOOGLE_USER = 'sender@example.com';
const {sendEmail, emailClient} = await import('../services/email-services.js');
const {default:config} = await import('../config/config.js');

test('email transport uses the configured sender and preserves provider acceptance', async t => {
  let payload;
  t.mock.method(emailClient, 'sendTransacEmail', async data => {payload=data;return {messageId:'accepted-test-message'};});
  t.mock.method(console, 'log', () => {});
  const result=await sendEmail('recipient@example.com','Verification','Use your code','<p>123456</p>');
  assert.equal(result.messageId,'accepted-test-message');
  assert.equal(payload.sender.email,'sender@example.com');
  assert.equal(payload.to[0].email,'recipient@example.com');
  assert.equal(payload.htmlContent,'<p>123456</p>');
});

test('provider failures cannot disclose credentials or OTPs through logs and errors', async t => {
  const secret='secret-key-and-otp-123456';
  t.mock.method(emailClient, 'sendTransacEmail', async () => {
    throw Object.assign(new Error(secret),{status:401,response:{status:401,body:secret},request:{headers:{'api-key':secret}}});
  });
  const logs=[];t.mock.method(console,'error',(...args)=>logs.push(args));
  await assert.rejects(sendEmail('recipient@example.com','Verification','OTP',secret), error => {
    assert.equal(error.code,'EMAIL_DELIVERY_FAILED');assert.ok(!error.message.includes(secret));return true;
  });
  assert.equal(JSON.stringify(logs).includes(secret),false);
  assert.equal(logs[0][1].status,401);
});

test('missing credentials fail before contacting the email provider', async t => {
  const previous=config.BREVO_API_KEY;config.BREVO_API_KEY='';t.after(()=>{config.BREVO_API_KEY=previous;});
  t.mock.method(emailClient,'sendTransacEmail',()=>assert.fail('Provider must not be called'));
  await assert.rejects(sendEmail('recipient@example.com','Verification','OTP','body'),{code:'PROVIDER_NOT_CONFIGURED'});
});

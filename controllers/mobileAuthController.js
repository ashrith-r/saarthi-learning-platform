import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Session from '../models/session.js';
import EmailOtp from '../models/otp.js';
import {MobileOtp} from '../models/mobileOtp.js';
import {normalizePhone, smsConfigured, issueMobileOtp, consumeMobileOtp} from '../services/mobileOtp.js';

function showVerification(req, res, status = 200, message = '') {
  return res.status(status).render('verify-mobile', {phone: req.session.mobileVerification.phone, message});
}
async function sendVerification(req, res) {
  try { await issueMobileOtp(req.session.mobileVerification); }
  catch (error) {
    if (!error.status) throw error;
    return showVerification(req, res, error.status, error.message);
  }
  return showVerification(req, res, 200, 'Code requested. Enter it when the SMS arrives.');
}

export async function registerMobile(req, res) {
  const phone = normalizePhone(req.body.phone);
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const {password, confirm} = req.body;
  if (!phone || !/^\S+@\S+\.\S+$/.test(email) || !username || username.length > 120 ||
      typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72 || password !== confirm) {
    req.flash('error', 'Enter your name, email, mobile number with country code and matching passwords of at least 8 characters.');
    return res.redirect('/auth/login?tab=register');
  }
  if (!smsConfigured()) return res.status(503).send('SMS verification is temporarily unavailable. Choose email verification or try again later.');
  let user = await User.findOne({email});
  if ((user && (user.verified || !await bcrypt.compare(password, user.password).catch(() => false))) || await User.exists({phone})) {
    req.flash('error', 'An account already uses these details. Sign in or use account recovery.');
    return res.redirect('/auth/login');
  }
  if (!user) user = await User.create({username, email, password: await bcrypt.hash(password, 12), verificationChannel: 'sms'});
  // A pending challenge never assigns a phone number or marks an account verified.
  req.session.mobileVerification = {phone, user: String(user._id), purpose: 'verify-phone'};
  return sendVerification(req, res);
}

export async function mobileSettings(req, res) {
  res.render('mobile-settings');
}
export async function sendBinding(req, res) {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).send('Enter a mobile number including its country code, starting with +.');
  const owner = await User.findOne({phone});
  if (owner && String(owner._id) !== String(req.user._id)) return res.status(400).send('This number is already linked to an account.');
  req.session.mobileVerification = {phone, user: String(req.user._id), purpose: 'bind-phone'};
  return sendVerification(req, res);
}
export async function resend(req, res) {
  if (!req.session.mobileVerification) return res.redirect('/auth/login?tab=register');
  const context = req.session.mobileVerification;
  if (context.purpose === 'bind-phone' && String(req.user?._id) !== context.user) return res.status(403).send('Sign in again to verify your mobile.');
  return sendVerification(req, res);
}
export async function verify(req, res) {
  const context = req.session.mobileVerification;
  if (!context) return res.redirect('/auth/login?tab=register');
  if (context.purpose === 'bind-phone' && String(req.user?._id) !== context.user) return res.status(403).send('Sign in again to verify your mobile.');
  const challenge = await consumeMobileOtp({...context, code: req.body.otpEntered});
  if (!challenge) return showVerification(req, res, 400, 'The code is incorrect, expired or has reached its retry limit. Request a new code.');
  try {
    const account = await User.findOneAndUpdate({_id: challenge.user}, {$set: {phone: challenge.phone, phoneVerifiedAt: new Date(),
      ...(context.purpose === 'verify-phone' ? {verified: true, verificationChannel: 'sms'} : {})}}, {returnDocument: 'after', runValidators: true});
    if (!account) return res.status(400).send('Account no longer exists.');
  } catch (error) {
    if (error.code !== 11000) throw error;
    delete req.session.mobileVerification;
    return res.status(400).send('This number has already been verified on another account. Use a different number.');
  }
  await MobileOtp.deleteMany({user: challenge.user});
  if (context.purpose === 'verify-phone') await EmailOtp.deleteMany({user: challenge.user});
  delete req.session.mobileVerification;
  req.flash('success', 'Mobile number verified. You can use it for password recovery.');
  return res.redirect(context.purpose === 'bind-phone' ? '/auth/mobile' : '/auth/login');
}

export async function forgotMobile(req, res) {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).send('Enter your mobile number with its country code.');
  if (!smsConfigured()) return res.status(503).send('SMS password recovery is temporarily unavailable. Try again later.');
  const user = await User.findOne({phone, phoneVerifiedAt: {$ne: null}, verified: true});
  req.session.mobileResetPhone = phone;
  if (user) {
    try { await issueMobileOtp({phone, user: user._id, purpose: 'reset-password'}); }
    catch (error) {
      // Keep the response identical for unknown numbers, rate limits and provider failures.
      if (!error.status) throw error;
    }
  }
  return res.render('reset-mobile', {message: 'If this number belongs to a verified account, a code has been requested. Codes expire after 10 minutes.'});
}
export async function resetMobile(req, res) {
  const phone = req.session.mobileResetPhone;
  if (!phone) return res.redirect('/auth/forgot-password?method=sms');
  const {password, confirm} = req.body;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72 || password !== confirm) {
    return res.status(400).render('reset-mobile', {message: 'Use matching passwords of at least 8 characters and no more than 72 bytes.'});
  }
  const challenge = await consumeMobileOtp({phone, purpose: 'reset-password', code: req.body.otpEntered});
  if (!challenge) return res.status(400).render('reset-mobile', {message: 'The code is incorrect, expired or has reached its retry limit. Request another code.'});
  const account = await User.findOneAndUpdate({_id: challenge.user, phone, phoneVerifiedAt: {$ne: null}, verified: true},
    {$set: {password: await bcrypt.hash(password, 12)}});
  if (!account) return res.status(400).send('The verified mobile number has changed. Request a new code.');
  await Promise.all([Session.updateMany({user: account._id}, {$set: {revoked: true}}),
    MobileOtp.deleteMany({user: account._id}), EmailOtp.deleteMany({user: account._id})]);
  delete req.session.mobileResetPhone;
  delete req.session.mobileVerification;
  res.clearCookie('accessToken'); res.clearCookie('refreshToken');
  req.flash('success', 'Password changed. Sign in with your email and new password.');
  res.redirect('/auth/login');
}

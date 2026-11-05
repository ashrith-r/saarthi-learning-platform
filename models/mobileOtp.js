import mongoose from 'mongoose';

const mobileOtpSchema = new mongoose.Schema({
  _id: String,
  phone: {type: String, required: true},
  purpose: {type: String, enum: ['verify-phone', 'bind-phone', 'reset-password'], required: true},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'userModel', required: true},
  otpHash: {type: String, required: true},
  attempts: {type: Number, default: 0},
  active: {type: Boolean, default: false},
  lastSentAt: {type: Date, required: true},
  expiresAt: {type: Date, required: true}
});
mobileOtpSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});
export const MobileOtp = mongoose.model('MobileOtp', mobileOtpSchema);

const budgetSchema = new mongoose.Schema({
  _id: String,
  count: {type: Number, default: 0},
  expiresAt: {type: Date, required: true}
});
budgetSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});
export const MobileOtpBudget = mongoose.model('MobileOtpBudget', budgetSchema);

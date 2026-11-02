import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'quizModel' },
  title: String,
  activeKey: {type:String},
  questions: { type: [mongoose.Schema.Types.Mixed], required: true },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  flags: { type: [String], default: [] },
  timeSpent: { type: mongoose.Schema.Types.Mixed, default: {} },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'submitted'], default: 'active' },
  marks: { type: Number, default: 1 }, penalty: { type: Number, default: 0 },
  result: mongoose.Schema.Types.Mixed,
  submittedAt: Date
}, { timestamps: true });
schema.index({ user: 1, status: 1, createdAt: -1 });
schema.index({activeKey:1},{unique:true,sparse:true});
export default mongoose.model('TestRun', schema);

import mongoose from 'mongoose';
const { Schema } = mongoose;
const progress = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'userModel', required: true },
  chapter: { type: Schema.Types.ObjectId, ref: 'chapterModel', required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  bookmarked: { type: Boolean, default: false },
  notes: { type: String, maxlength: 10000, default: '' }
}, { timestamps: true });
progress.index({ user: 1, chapter: 1 }, { unique: true });
const task = new Schema({
  user: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, maxlength: 160 },
  date: { type: String, required: true },
  done: { type: Boolean, default: false }
}, { timestamps: true });
task.index({ user: 1, date: 1 });
const profile = new Schema({
  user: { type: Schema.Types.ObjectId, required: true, unique: true },
  exam: { type: String, default: '' }, targetDate: String,
  weeklyGoal: { type: Number, default: 5, min: 1, max: 50 }
});
export const Progress = mongoose.model('Progress', progress);
export const Task = mongoose.model('StudyTask', task);
export const Profile = mongoose.model('StudyProfile', profile);

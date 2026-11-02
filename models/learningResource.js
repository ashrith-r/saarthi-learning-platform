import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'chapterModel', required: true, index: true },
  kind: { type: String, enum: ['video', 'document', 'link'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, maxlength: 5000, default: '' },
  url: { type: String, default: '' },
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  instructor: { type: String, maxlength: 100, default: '' },
  duration: { type: String, maxlength: 40, default: '' },
  position: {type:Number,default:0,min:0,max:9999},
  archived: {type:Boolean,default:false},
  published: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel' }
}, { timestamps: true });
export default mongoose.model('LearningResource', schema);

import mongoose from 'mongoose';
export default mongoose.model('AuditEvent',new mongoose.Schema({actor:{type:mongoose.Schema.Types.ObjectId,ref:'userModel'},action:String,target:String,details:String},{timestamps:true}));

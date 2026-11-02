import mongoose from "mongoose";

const Schema = mongoose.Schema

const otpSchema = new Schema({
  purpose: {
    type: String,
    enum: ["verify-email", "reset-password"],
    required: true
  },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"userModel",
    required:[true,"User is Required"]

  },
  email:{
    type:String,
    trim:true,
    lowercase:true,
    required:[true,"Email is Required"]
  },
  otpHash:{
    type:String,
    required:[true,"otpHash is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
},{
  timestamps:true
});

otpSchema.index({ email: 1 });

const otpModel = mongoose.model("otpModel",otpSchema)
export default otpModel

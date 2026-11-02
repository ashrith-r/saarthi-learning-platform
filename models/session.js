import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema({
   user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"userModel",
    required:[true,"User is Required"]
   },
   refreshToken:{
    type:String,
    required:[true,"RefreshToken is Required"]
   },
   ip:{
    type:String,
    required:[true,"IP is required"]
   },
   userAgent:{
    type:String,
    required:[true,"UserAgent is Required"]
   },
   revoked:{
    type:Boolean,
    default:false
   },
   createdAt: {
    type: Date,
    default: Date.now,
    expires: 1296000
   }
},{
  timestamps:true
})

const sessionModel = mongoose.model("sessionModel",sessionSchema)

export default sessionModel

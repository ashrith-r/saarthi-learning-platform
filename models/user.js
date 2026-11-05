import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
  phone: {type: String, match: /^\+[1-9]\d{7,14}$/},
  phoneVerifiedAt: Date,
  emailVerifiedAt: Date,
  verificationChannel: {type: String, enum: ['email', 'sms'], default: 'email'},
  editor: { type: Boolean, default: false },
  username:{
    type:String,
    trim:true,
    required:[true,"Username is Required"]
  },
  email:{
    type:String,
    trim:true,
    lowercase:true,
    required:[true,"Email is Required"],
    unique:true,
    match:[/^\S+@\S+\.\S+$/,"Email is invalid"]
  },
  password:{
    type:String,
    required:[true,"Password is Required"]
  },
  verified:{
    type:Boolean,
    default:false
  },
  moderator:{
    type:Boolean,
    default:false
  },admin:{
    type:Boolean,
    default:false

  }
});


userSchema.index({phone: 1}, {unique: true, sparse: true});
const userModel = mongoose.model("userModel",userSchema);

export default userModel;

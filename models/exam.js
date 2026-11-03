import mongoose from "mongoose";

const Schema = mongoose.Schema

const examSchema = new Schema({
  examName:{
    type:String,
    required:[true,"Exam Name is required"]
  },
  subjects:{

    type:[String],
    default:[]
  },
  courseType:{
    type:String,
   required: [true,"Course Type is required"]
  
  }
,
  icon:{
    type:String,
    default:"",
    maxlength:64
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "userModel"
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "userModel"
  }
}, {
  timestamps: true
});

examSchema.index({ courseType: 1 });

const examModel = mongoose.model("examModel",examSchema)
export default examModel

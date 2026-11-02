import mongoose from "mongoose";

const Schema = mongoose.Schema;

const subjectSchema = new Schema({
  examID:{
    type:Schema.Types.ObjectId,
    ref:"examModel",
    required:[true,"Exam is Required"]
  },
  subjectName:{
    type:String,
    required:[true,"Subject Name is required."]
  },
  description:{
    type:String,
        required:[true,"Subject Description is required."]

  },
  chapterCount:{
    type:Number,
    required:[true,"Chapter Count is required"]
  },
  icon:{
    type:String,
    default:""
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
})

subjectSchema.index({ examID: 1 });

const subjectModel = mongoose.model("subjectModel",subjectSchema)
export default subjectModel

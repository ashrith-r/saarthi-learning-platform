import mongoose, { Types } from "mongoose";
import subjectModel from "./subjects.js";

const Schema = mongoose.Schema;

const chapterSchema = new Schema({
  subjectID:{
    type:Schema.Types.ObjectId,
    ref:"subjectModel",
    required:[true,"SubjectID is Required"]

  },
  chapterName:{
    type:String,
    required:[true,"Chapter Name is Required"]
  },
  description:{
    type:String,
    required:[true,"Chapter Description is Required"]
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

chapterSchema.index({ subjectID: 1 });

const chapterModel = mongoose.model("chapterModel",chapterSchema);
export default chapterModel;

import mongoose from "mongoose";
const Schema = mongoose.Schema;

const sheetSchema = new Schema({

  position:{type:Number,default:0,min:0,max:9999},
  archived:{type:Boolean,default:false},
  published:{type:Boolean,default:true},
  chapterID:{
    type:Schema.Types.ObjectId,
    ref:"chapterModel",
    required:[true,"ChapterID is required."]
  },
  title:{
    type:String,
        required:[true,"Title is required."]
  },
  url:{
    type:String,
        required:[true,"URL is required."]
  }
  ,
  page:{
    type:Number,
     required:[true,"Number of Page is required."]

  },
  level:{
    type:String,
        required:[true,"Level is required."]

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

sheetSchema.index({ chapterID: 1 });

const sheetModel = mongoose.model("sheetModel",sheetSchema);
export default sheetModel

import mongoose from "mongoose";

const Schema = mongoose.Schema;

const updateSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  examID: {
    type: Schema.Types.ObjectId,
    ref: "examModel"
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

updateSchema.index({ examID: 1, date: -1 });
updateSchema.index({ isImportant: 1, date: -1 });

const updateModel = mongoose.model("updateModel", updateSchema);
export default updateModel;

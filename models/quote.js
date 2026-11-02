import mongoose from "mongoose";
const Schema = mongoose.Schema;

const quoteSchema = new Schema({
  content: {
    type: String,
    required: [true, "Quote content is required"]
  },
  author: {
    type: String,
    default: "Anonymous"
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

const quoteModel = mongoose.model("quoteModel", quoteSchema);
export default quoteModel;

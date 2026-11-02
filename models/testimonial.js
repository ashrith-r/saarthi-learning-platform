import mongoose from "mongoose";
const Schema = mongoose.Schema;

const testimonialSchema = new Schema({
  initial: {
    type: String,
    required: [true, "Initial is required"]
  },
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  role: {
    type: String,
    required: [true, "Role is required"]
  },
  quote: {
    type: String,
    required: [true, "Quote content is required"]
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

const testimonialModel = mongoose.model("testimonialModel", testimonialSchema);
export default testimonialModel;

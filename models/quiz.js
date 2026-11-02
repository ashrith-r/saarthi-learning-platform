import mongoose from "mongoose";

const Schema = mongoose.Schema;

const quizSchema = new Schema(
  {
    versions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    status: { type: String, enum: ['draft', 'reviewed', 'published'], default: 'published' },
    durationMinutes: { type: Number, default: 20, min: 1, max: 240 },
    marks: { type: Number, default: 1, min: 1, max: 10 },
    penalty: { type: Number, default: 0, min: 0, max: 10 },
    chapterID: {
      type: Schema.Types.ObjectId,
      ref: "chapterModel",
      required: [true, "Chapter ID is required."],
    },
    title: {
      type: String,
      required: [true, "Quiz title is required."],
      trim: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "questionModel",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on chapterID for efficient queries
quizSchema.index({ chapterID: 1 });

const quizModel = mongoose.model("quizModel", quizSchema);

export default quizModel;

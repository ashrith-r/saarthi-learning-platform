import mongoose from "mongoose";

const Schema = mongoose.Schema;

const quizAttemptSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "quizModel",
      required: true,
    },
    answers: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: "questionModel",
          required: true,
        },
        selectedOption: {
          type: Schema.Types.ObjectId,
          default: null,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    weaknesses: {
      chapters: [
        {
          type: String,
        },
      ],
      tags: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying of attempts per user or quiz
quizAttemptSchema.index({ user: 1, quiz: 1 });

const quizAttemptModel = mongoose.model("quizAttemptModel", quizAttemptSchema);

export default quizAttemptModel;

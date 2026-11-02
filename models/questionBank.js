import mongoose from "mongoose";

const Schema = mongoose.Schema;

const imageSchema = new Schema(
  {
    url: String,
    filename: String,
  },
  { _id: false }
);

const optionSchema = new Schema(
  {
    text: {
      type: String,
      trim: true,
      default: "",
    },

    img: imageSchema,
  },
  { _id: true } // Keeps ObjectId for each option
);

const questionSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "examModel",
      required: [true, "Course is required"],
    },

    question_text: {
      type: String,
      trim: true,
      default: "",
    },

    question_img: imageSchema,

    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A question must have at least 2 options.",
      },
    },

    // Stores the _id of the correct option
    correctOption: {
      type: Schema.Types.ObjectId,
      required: [true, "Correct option is required"],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    chapter: {
      type: String,
      required: [true, "Chapter is required"],
      trim: true,
    },

    level: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    tags: {
      type: [String],
      default: [],
    },

    solution: {
      text: {
        type: String,
        default: "",
      },

      img: imageSchema,
    },

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

// Ensure question has either text or image
// questionSchema.pre("validate", function (next) {
//   if (
//     !this.question_text?.trim() &&
//     !this.question_img?.url
//   ) {
//     return next(
//       new Error("Question must contain either text or an image.")
//     );
//   }

//   next();
// });

const questionModel = mongoose.model("questionModel", questionSchema);

export default questionModel;
import mongoose from "mongoose";

export const ProblemDifficulty = Object.freeze({
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
});

if (mongoose.models.UserProblem) {
  mongoose.deleteModel("UserProblem");
}

const userProblem = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    require: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  testCase: {
    type: [
      {
        input: {
          type: [String],
        },
        expected: {
          type: String,
        },
        explanation: {
          type: String,
        },
      },
    ],
  },
  constraints: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
  },
  acceptance: {
    type: Number,
    default: 0,
  },
  templateCode: {
    type: String,
  },
  pythonTemplateCode: {
    type: String,
  },
});

export const UserProblem = mongoose.model("UserProblem", userProblem);

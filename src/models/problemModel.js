import mongoose from "mongoose";

export const ProblemDifficulty = Object.freeze({
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
});

if (mongoose.models.Problem) {
  mongoose.deleteModel("Problem");
}

const problemSchema = new mongoose.Schema({
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

export const Problem = mongoose.model("Problem", problemSchema);

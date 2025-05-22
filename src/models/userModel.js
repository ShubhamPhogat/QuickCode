import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    // Using string type for Snowflake IDs
  },
  name: {
    type: String,
    maxlength: 64,
    default: null,
  },
  email: {
    type: String,
    maxlength: 128,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    maxlength: 64,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  requestCount: {
    type: Number,
    default: 0,
  },
  accountType: {
    type: String,
    enum: ["free", "premium"],
    default: "free",
  },
  lastUsedDate: {
    type: Date,
    default: Date.now(),
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);

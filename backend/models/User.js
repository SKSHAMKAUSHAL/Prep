const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true }, // Optional, sparse allows multiple nulls
    profileImageUrl: { type: String, default: null },
    tokens: { type: Number, default: 1000 },
    tokensLastReset: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

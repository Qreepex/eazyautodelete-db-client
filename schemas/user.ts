import mongoose from "mongoose";

export default mongoose.model(
  "user",
  new mongoose.Schema({
    id: { type: String },
    registered: { type: Number, default: new Date().getTime() },
    language: { type: String, default: "en" },
  })
);

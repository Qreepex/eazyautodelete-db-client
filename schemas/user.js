const mongoose = require("mongoose")
module.exports = mongoose.model("user", new mongoose.Schema({
    id: { type: String },
    registered: { type: Number, default: new Date().getTime() },
    language: { type: String, default: "en" }
}));
const mongoose = require("mongoose");
module.exports = mongoose.model(
  "channel",
  new mongoose.Schema({
    id: { type: String },
    guild: { type: String },
    registered: { type: Number, default: new Date().getTime() },
    limit: { type: Number, default: null }, // Zeit in ms oder Nachrichten Anzahl
    mode: { type: Number, default: 0 },
    ignore: { type: Array, default: [] },
    filters: { type: Array, default: [] },
    regex: { type: String, default: null },
    filterUsage: { type: String, default: "one" },
  })
);

const mongoose = require("mongoose")
module.exports = mongoose.model("guild", new mongoose.Schema({
    id: { type: String },
    prefix: { type: String, default: "%" },
    registered: { type: Number, default: new Date().getTime() },
    premium: { type: Boolean, default: false },
    adminroles: { type: Array, default: [] },
    modroles: { type: Array, default: [] }
}));
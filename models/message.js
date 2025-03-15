const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    message: { type: String, required: true },  // This must match your form input name
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["pending", "delivered", "seen"],  // WhatsApp-like statuses
        default: "pending"
    },
});

module.exports = mongoose.model("Message", messageSchema);

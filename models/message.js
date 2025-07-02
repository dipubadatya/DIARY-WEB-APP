const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    message: { type: String, required: true },  // This must match your form input name
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
 isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],  
        default: "sent"
    },
         
  
   
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
   
});

module.exports = mongoose.model("Message", messageSchema);

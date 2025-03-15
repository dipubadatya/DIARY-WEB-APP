const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({

    comment: {
        type: String,
   
    },
    gif: String, 
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',

    },

 timeStamp:{
    type: Date,
    // default: new Date().toISOString()
    default: () => new Date() 
 }

});

module.exports = mongoose.model("Comment", commentSchema);

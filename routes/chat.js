const express = require("express");
const router = express.Router();
const isLoggedIn = require('../middleware')
const Message = require("../models/message");
const User = require("../models/users");

const moment =require('moment')

// router.get("/:receiverId", isLoggedIn, async (req, res) => {
//     try {
//         const { receiverId } = req.params;

        
//         const messages = await Message.find({
//             $or: [
//                 { sender: req.user._id, receiver: receiverId },
//                 { sender: receiverId, receiver: req.user._id }
//             ]
//         }).sort({ timestamp: 1 });
//         const receiverUser  = await User.findById(receiverId);

//         res.render("./stories/chat2", { messages, receiverId,receiverUser , user: req.user});
//     } catch (error) {
//         console.error(error);
//         res.redirect("/");
//     }
// });

router.get("/:receiverId", isLoggedIn, async (req, res) => {
    try {
        const { receiverId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: receiverId },
                { sender: receiverId, receiver: req.user._id }
            ]
        }).sort({ timestamp: 1 });

        const receiverUser = await User.findById(receiverId);

        // Add a date field to each message
        const messagesWithDate = messages.map(msg => ({
            ...msg._doc,
            date: moment(msg.timestamp).format('YYYY-MM-DD')
        }));

        res.render("./stories/chat2", { messages: messagesWithDate, receiverId, receiverUser, user: req.user,moment });
    } catch (error) {
        console.error(error);
        res.redirect("/");
    }
});

router.post("/:receiverId", async (req, res) => {
    try {
        if (!req.body.message) {
            req.flash("error", "Message cannot be empty!");
            return res.redirect("back");
        }

        const newMessage = new Message({
            message: req.body.message,  
            sender: req.user._id,
            receiver: req.params.receiverId
        });

        await newMessage.save();
        res.redirect(`/chat/${req.params.receiverId}`);
    } catch (error) {
        console.error(error);
        res.redirect("/");
    }
});

module.exports = router;

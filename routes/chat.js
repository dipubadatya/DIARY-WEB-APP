  

const express = require("express");
const router = express.Router();
const isLoggedIn = require('../middleware/middleware');
const Message = require("../models/message");
const User = require("../models/users");
const moment = require('moment');
       
// Chat list route
router.get("/", isLoggedIn, async (req, res) => {
    try {
        // Get all conversations for the current user
        const messages = await Message.find({
            $or: [  
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        }).sort({ timestamp: -1 });
        
        // Get unique users the current user has chatted with
        const userIds = new Set();
        const conversations = [];                     
         
        for (const msg of messages) { 
            const otherUserId = msg.sender.equals(req.user._id) ? msg.receiver : msg.sender;
            
            if (!userIds.has(otherUserId.toString())) {
                userIds.add(otherUserId.toString());
                
                // Get user details
                const user = await User.findById(otherUserId);
                if (user) {
                    // Get unread count
                    const unreadCount = await Message.countDocuments({
                        sender: otherUserId,
                        receiver: req.user._id,
                        status: { $in: ['delivered', 'sent'] }
                    });
                    
                    conversations.push({
                        user,
                        lastMessage: msg,
                        unreadCount
                    });
                }
            }
        }
                     
        // Sort conversations by last message timestamp
        conversations.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
        
        res.render("./stories/chat-list", { 
            conversations, 
            user: req.user,
            moment 
        });
    } catch (error) {
        console.error(error);
        res.redirect("/");
    }                                           
});
                                 
// Individual chat route
router.get("/:receiverId", isLoggedIn, async (req, res) => {
    try {
        const { receiverId } = req.params;
        
        // Mark messages as read
        await Message.updateMany(
            { sender: receiverId, receiver: req.user._id, status: { $in: ['sent', 'delivered'] } },
            { $set: { status: 'seen' } }
        );

        // Get messages for the specific conversation
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: receiverId },
                { sender: receiverId, receiver: req.user._id }
            ]
        }).sort({ timestamp: 1 });
        
        const receiverUser = await User.findById(receiverId);
        
        // Add date field to each message
        const messagesWithDate = messages.map(msg => ({
            ...msg._doc,
            date: moment(msg.timestamp).format('YYYY-MM-DD')   
        }));
           
                    
        res.render("./stories/chat-message", { 
            messages: messagesWithDate, 
            receiverId, 
            receiverUser, 
            user: req.user,
            moment ,
           
        });
    } catch (error) {  
        console.error(error);
        res.redirect("/chat");
    }
}); 
 
router.post("/:receiverId", isLoggedIn, async (req, res) => {
    try {
        if (!req.body.message) {
            req.flash("error", "Message cannot be empty!");
            return res.redirect("back");
        }

        const newMessage = new Message({
            message: req.body.message,
            sender: req.user._id,
            receiver: req.params.receiverId,
            status: 'sent'
        });

        await newMessage.save();
        res.redirect(`/chat/${req.params.receiverId}`);
    } catch (error) {
        console.error(error);
        res.redirect("/chat");
    }
});    
        



module.exports = router;
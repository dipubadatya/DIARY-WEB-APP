require('dotenv').config();
const express = require('express');
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const giphy = require('giphy-api')(process.env.GIPHY_API_KEY);
const server = http.createServer(app);
const io = socketIo(server);
const cors = require('cors')
const port = process.env.PORT || 4000;
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userRoutes = require('./routes/user.js');
const storiesRoutes = require('./routes/stories');
const commentRoutes = require('./routes/comment');
const chatRoutes = require('./routes/chat');
const database = require('./dbConfig.js');
const passport = require('passport');
const User = require('./models/users');
const Message = require('./models/message.js');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');
const loggedIn = require('./middleware');
const axios = require('axios');



// Database connection                                                                           
database();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride("_method"));
app.use(cors())
app.engine('ejs', ejsMate);
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_ATLAS,
    crypto: { secret: process.env.SESSION_CRYPTO_SECRET },
    touchAfter: 24 * 3600
});

store.on('error', (err) => {
    console.log('Session store error:', err);
});

const sessionOption = {
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,

    saveUninitialized: false,
    cookie: {
        httpOnly: true,

        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    },

    
};

app.use(session(sessionOption));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware for flash messages and current user
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

app.get('/', (req, res) => {

    res.render('./stories/landing.ejs');


});



io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('authenticate', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);

        User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date()
        }).then(() => {
            io.emit('userStatus', {
                userId,
                isOnline: true,
                lastSeen: new Date()
            });
        });
    });


    socket.on('sendMessage', async ({ sender, receiver, message }) => {
        try {
            const newMessage = new Message({
                sender,
                receiver,
                message,
                status: 'sent'
            });

            const savedMessage = await newMessage.save();

            await Message.updateOne(
                { _id: savedMessage._id },
                { $set: { status: 'delivered' } }
            );

            io.to(sender).to(receiver).emit('newMessage', {
                ...savedMessage.toObject(),
                status: 'delivered'
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('typing', ({ sender, receiver, username }) => {
        socket.to(receiver).emit('typing', { sender, username });
    });

    socket.on('stopTyping', ({ sender, receiver }) => {
        socket.to(receiver).emit('stopTyping', { sender });
    });

    socket.on('markAsSeen', async ({ sender, receiver }) => {
        try {
            await Message.updateMany(
                { sender, receiver, status: 'delivered' },
                { $set: { status: 'seen', seenAt: new Date() } }
            );

            // Notify both users
            io.to(sender).emit('messagesSeen', { receiver });
            io.to(receiver).emit('messagesSeen', { sender: receiver }); // Update current user's UI

        } catch (error) {
            console.error('Error marking messages as seen:', error);
        }
    });


    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);

        const rooms = Array.from(socket.rooms);
        if (rooms.length > 1) {
            const userId = rooms[1];

            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
            });

            io.emit('userStatus', {
                userId,
                isOnline: false,
                lastSeen: new Date()
            });
        }
    });
});
// Routes     
app.use('/', userRoutes);
app.use("/chat", chatRoutes);
app.use('/', storiesRoutes);
app.use('/', commentRoutes);


app.use('*', (req, res, next) => {
    res.render('./stories/pageNotFound');
    next();
});
app.use((err, req, res, next) => {
    console.log(err);
    next();
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.http_code || 500).json({
        message: err.message,
        name: err.name,
        storageErrors: err.storageErrors || [],
    });
});
app.use((req, res, next) => {
    console.log('Session:', req.session);
    next();
});


// app.use((err, req, res, next) => {                                                                
//     console.error(err.stack);
//     if (!res.headersSent) {
//         res.status(500).send('Something went wrong!');
//     }
// });

// Server start
server.listen(port, () => {
    console.log("Server running on port 3000");
});


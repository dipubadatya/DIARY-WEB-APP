require('dotenv').config();
const express = require('express');
const http = require("http");
const socketIo = require("socket.io");
const giphy = require('giphy-api')(process.env.GIPHY_API_KEY);
const app = express();
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
// const Message = require('./models/comment.js');
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


// Session setup
const store = MongoStore.create({
    // mongoUrl: process.env.MONGO_LOCAL,
    mongoUrl: process.env.MONGO_ATLAS,
    crypto: { secret: process.env.SESSION_CRYPTO_SECRET },
    touchAfter: 24 * 3600
});

const sessionOption = {
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly:true,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    
    },
};

store.on('error', () => {
    console.log('session error', err);
});

passport.use(passport.initialize());
passport.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

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
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("sendMessage", async ({ sender, receiver, message }) => {
        try {
            const newMessage = new Message({ sender, receiver, message });
            await newMessage.save();

            // Emit the message to both sender and receiver
            io.emit("receiveMessage", { sender, receiver, message, timestamp: new Date()  });
        } catch (error) {
            console.error("Error sending message:", error);
        }
   
    });

    socket.on("userTyping", ({ senderId }) => {
        socket.broadcast.emit("userTyping", { senderId });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
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

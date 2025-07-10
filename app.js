require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const giphy = require("giphy-api")(process.env.GIPHY_API_KEY);
const server = http.createServer(app);
const io = socketIo(server);
const cors = require("cors");
// const port = process.env.PORT || 4000;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const userRoutes = require("./routes/user.js");
const storiesRoutes = require("./routes/stories");
const commentRoutes = require("./routes/comment");
const chatRoutes = require("./routes/chat");
const database = require("./dbConfig.js");
const passport = require("passport");
const User = require("./models/users");
const Message = require("./models/message.js");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const ejsMate = require("ejs-mate");
const loggedIn = require("./middleware");
const axios = require("axios");

require("./socketHandler.js")(io);

// Database connection
database();

app.get("/", (req, res) => {
  res.render("./stories/landing.ejs");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(cors());
app.engine("ejs", ejsMate);
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
);

const store = MongoStore.create({
  mongoUrl: process.env.MONGO_ATLAS,
  crypto: { secret: process.env.SESSION_CRYPTO_SECRET },
  // touchAfter: 24 * 3600
  ttl: 7 * 24 * 60 * 60,
  autoRemove: 'native'

}); 

const sessionOption = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,

  saveUninitialized: false,
  cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    },

    
};

store.on("error", (err) => {
  console.log("Session store error:", err);
});

app.use(session(sessionOption));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// Middleware for flash messages and current user
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Routes
app.use("/", userRoutes);
app.use("/chat", chatRoutes);
app.use("/", storiesRoutes);
app.use("/", commentRoutes);

app.use("*", (req, res, next) => {
  res.render("./stories/pageNotFound");
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
  console.log("Session:", req.session);
  next();
});

// // Server start
// server.listen(port, () => {
//   console.log("Server running on port 3000");
// });
// In your Node.js app, make sure you're listening on 0.0.0.0
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server running`);
});

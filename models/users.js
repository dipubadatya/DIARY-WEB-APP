
const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const Stories = require('../models/stories');
const Comments = require('../models/comment');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: { 
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        url: {
            type: String,
            default: "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o="
        },
        filename: {
            type: String,
            default: 'profile_image'
        },
        publicId: {
            type: String,
        }
    },
    banner: {
        url: {
            type: String,
            default: 'https://i.pinimg.com/736x/7c/05/b9/7c05b92ca71023ebde50496547407ac5.jpg'
        },
        filename: {
            type: String,
            default: 'profile_image'
        },
        publicId: {
            type: String,
        }
    },
    bio: {
        type: String,
    },
    stories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    notifications: [{
        type: {
            type: String,
            enum: ["like", "follow", "comment"],
            required: true
        },
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stories', default: null },
        timeStamp: {
            type: Date,
            default: Date.now
        },
        read: { type: Boolean, default: false }
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});  

// Pre-save hook to check for duplicate email
userSchema.pre('save', async function (next) {
    if (this.isModified('email')) {
        const existingUser = await this.constructor.findOne({ email: this.email });
        if (existingUser && !existingUser._id.equals(this._id)) {
            throw new Error('Email already in use');
        }
    }
    next();
});

// Static method to cleanup old unverified users
userSchema.statics.cleanupUnverifiedUsers = async function () {
    try {
        const cutoff = new Date(Date.now() - 2 * 60 * 1000); 
        const result = await this.deleteMany({
            isVerified: false,
            createdAt: { $lt: cutoff }
        });
        console.log(`Cleaned up ${result.deletedCount} unverified users`);
        return result;
    } catch (err) {
        console.error('Error in cleanupUnverifiedUsers:', err);
        throw err;
    }
};

// Setup cleanup interval (run every 5 minutes)
const cleanupInterval = setInterval(async () => {
    try {
        const User = mongoose.model('User');
        await User.cleanupUnverifiedUsers();
    } catch (err) {
        console.error('Error in cleanup interval:', err);
    }
}, 5 * 60 * 1000);

process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    process.exit();
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);

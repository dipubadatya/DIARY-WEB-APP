
const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/users')
const Comments = require('../models/comment')
const Stories = require('../models/stories')
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const flash = require('connect-flash');
const axios = require('axios')
const { storage } = require('../cloudinary.js')
const Joi = require('joi');
const upload = multer({ storage })
const isLoggedIn = require('../middleware')
const validator = require('validator')
const moment = require('moment');
const crypto = require('crypto');
const nodemailer = require('nodemailer');





router.delete('/delete', isLoggedIn, async (req, res) => {
  try {
    let currUser = req.user._id
    const user = await User.findById(currUser);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    await Stories.deleteMany({ owner: currUser });
    await Comments.deleteMany({ author: currUser });

    res.redirect('/stories')
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err });
  }
});


//find following list
router.get('/following/:id', isLoggedIn, async (req, res) => {
  let { id } = req.params
  let profile = await User.findById(id).populate('following').populate('followers')
  res.render('./users/following.ejs', { profile })
})

//find followers list

router.get('/followers/:id', isLoggedIn, async (req, res) => {
  let { id } = req.params
  let profile = await User.findById(id).populate('following').populate('followers')

  res.render('./users/followers.ejs', { profile })

})


router.get('/check-unread-notifications', isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false });

    let unreadCount = user.notifications.filter(notif => !notif.read).length;
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get('/notification', isLoggedIn, async (req, res) => {
  let user = await User.findById(req.user._id).populate({
    path: 'notifications.fromUser',
    select: 'username name image'
  });

  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/");
  }

  // Mark all notifications as read
  user.notifications.forEach(notif => notif.read = true);
  await user.save();

  // Group notifications
  let today = [];
  let yesterday = [];
  let last7Days = [];

  let currentDate = moment().startOf('day');
  let yesterdayDate = moment().subtract(1, 'days').startOf('day');
  let sevenDaysAgo = moment().subtract(7, 'days').startOf('day');

  user.notifications.forEach(notif => {
    let notifDate = moment(notif.timeStamp);

    if (notifDate.isSame(currentDate, 'day')) {
      today.push(notif);
    } else if (notifDate.isSame(yesterdayDate, 'day')) {
      yesterday.push(notif);
    } else if (notifDate.isAfter(sevenDaysAgo)) {
      last7Days.push(notif);
    }
  });

  res.render('./stories/notification.ejs', {
    user,
    today,
    yesterday,
    last7Days
  });
});


// DELETE Notification Route
router.delete("/notification/:notifId", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
    const { notifId } = req.params;


    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/notification");
    }


    user.notifications = user.notifications.filter(
      (notif) => notif._id.toString() !== notifId
    );

    await user.save();
    return res.redirect("/notification");


  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

module.exports = router;



//user dashbord
router.get('/dashbord', isLoggedIn, async (req, res) => {
  let user = await User.findById(req.user._id).populate('stories').populate({
    path: 'notifications.fromUser',
    select: 'username name'
  });

  const pageTitle = `Welcome to Your Dashboard, ${user.name}`;
  const pageDescription = `View your latest activities, stats, and notifications on your personalized dashboard.`;
  res.render('./users/dashbord.ejs', { user, pageTitle, pageDescription })
})


//edit user dashbord
router.put('/dashbord/:id', isLoggedIn, upload.single('dashbord[image]'), async (req, res) => {
  let { id } = req.params
  let user = await User.findByIdAndUpdate(id, { ...req.body.dashbord })

  if (typeof req.file !== 'undefined') {
    let url = req.file.path
    let filename = req.file.originalname
    user.image = { url, filename }
    await user.save()
  }
  req.flash("success", "profile updated successfully")
  return res.redirect(`/dashbord`)

})

router.put('/profile/:id/banner', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const isXHR = req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (typeof req.file !== 'undefined') {
      const url = req.file.path;
      const filename = req.file.originalname;
      publicId = req.file.filename,
        user.banner = { url, filename, publicId };
      await user.save();


      if (isXHR) {
        return res.json({
          success: true,
          message: 'Banner image updated successfully',
          imageUrl: url
        });
      }
    }


    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating banner image:', error);


    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ error: 'Failed to update banner image' });
    }

    res.redirect('/profile');
  }
});

// Update your route to handle the filtered and cropped image
router.put('/profile/:id/image', isLoggedIn, upload.single('prof-image'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      npm
      return res.status(404).json({ error: 'User not found' });
    }

    const isXHR = req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (typeof req.file !== 'undefined') {
      const url = req.file.path;
      const filename = req.file.originalname;
      publicId = req.file.filename,
        user.image = { url, filename, publicId };
      await user.save();

      if (isXHR) {
        return res.json({
          success: true,
          message: 'Profile image updated successfully',
          imageUrl: url
        });
      }
    }


    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile image:', error);


    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ error: 'Failed to update profile image' });
    }

    res.redirect('/profile');
  }
});

router.put('/profile/:id/delete', isLoggedIn, async (req, res) => {
  let { id } = req.params
  console.log(id)
  let user = await User.findById(id);
  user.banner = { url: '', filename: '' }
  await user.save()
  res.redirect(`/profile`)
})

//current user profile
router.get('/profile', isLoggedIn, async (req, res) => {
  const currUser = req.user
  const user = req.user


  let profile = await User.findById(currUser).populate('stories')

  const pageTitle = `${profile.username}'  s Profile`;
  const pageDescription = `View and edit your profile information including personal details, preferences, and more.`;
  res.render('./users/account.ejs', { profile, user, pageTitle, pageDescription })
})

// other user profiles
router.get('/profile/:id', isLoggedIn, async (req, res) => {
  let { id } = req.params
  const user = req.user


  let profile = await User.findById(id).populate('stories')
  const pageTitle = `${profile.username}'   s Profile`;
  const pageDescription = `View and edit your profile information including personal details, preferences, and more.`;

  res.render('./users/account.ejs', { profile, user, pageTitle, pageDescription })
})

router.post('/follow/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Find users
    const userToFollow = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.equals(currentUserId)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    if (!userToFollow.followers.includes(currentUserId)) {
      userToFollow.followers.push(currentUserId);
      currentUser.following.push(userToFollow._id);

      // Send notification to the followed user
      userToFollow.notifications.push({
        type: "follow",
        fromUser: currentUserId
      });

      await userToFollow.save();
      await currentUser.save();
    }

    res.redirect(`/profile/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// unfollow functionality
router.post('/unfollow/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Find both users
    const userToUnfollow = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }


    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => !followerId.equals(currentUserId)
    );
    currentUser.following = currentUser.following.filter(
      (followingId) => !followingId.equals(userToUnfollow._id)
    );

    await userToUnfollow.save();
    await currentUser.save();

    res.redirect(`/profile/${id}`)

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password - Show form
router.get('/forgot-password', (req, res) => {
  res.render('./users/forgot-password', {
    title: 'Forgot Password',

  });
});

// Forgot Password - Handle submission
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'If that email exists, we\'ve sent a reset link');
      return res.redirect('/forgot-password');
    }


    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `${req.protocol}://${req.headers.host}/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: `"DIARY-WEB-APP" <${process.env.EMAIL_USER}>`,
      subject: '✍️ Reset your Diary password',
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
      body { font-family: 'Open Sans', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; }
      .container { padding: 30px; }
      .header { text-align: center; margin-bottom: 25px; }
      .logo { 
        font-family: 'Merriweather', serif;
        font-size: 28px; 
        font-weight: 700; 
        color: #2d3748; 
        margin-bottom: 5px;
      }
      .tagline {
        color: #718096;
        font-style: italic;
        margin-bottom: 20px;
      }
      .divider {
        height: 3px;
        background: linear-gradient(90deg, #f6ad55, #f687b3, #805ad5);
        margin: 25px 0;
        border-radius: 3px;
      }
      .button { 
        display: inline-block; 
        background: linear-gradient(135deg, #805ad5, #d53f8c); 
        color: white !important; 
        padding: 14px 28px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600; 
        margin: 25px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      }
      .url-container {
        background-color: #f8fafc;
        border-left: 4px solid #805ad5;
        padding: 15px;
        border-radius: 0 4px 4px 0;
        margin: 20px 0;
      }
      .url {
        word-break: break-all;
        font-family: monospace;
        color: #4a5568;
      }
      .footer { 
        margin-top: 40px; 
        padding-top: 20px; 
        border-top: 1px solid #edf2f7; 
        font-size: 13px; 
        color: #718096; 
        text-align: center;
      }
      .social-links a {
        display: inline-block;
        margin: 0 10px;
        text-decoration: none;
      }
      .social-icon {
        width: 24px;
        height: 24px;
        vertical-align: middle;
      }
      .username {
        font-weight: 600;
        color: #2d3748;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Diary</div>
        <div class="tagline">Where your stories come to life</div>
        <div class="divider"></div>
      </div>

      <p>Hi <span class="username">${user.username}</span>,</p>
      
      <p>We received a request to reset your Diary password. Don't worry - every great story needs the right key to continue!</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Continue Your Story →</a>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      
      <div class="url-container">
        <code class="url">${resetUrl}</code>
      </div>
      
      <p><strong>Note:</strong> This link will expire in 1 hour for your security.</p>
      <p>If you didn't request this, you can safely ignore this email - your story remains unchanged.</p>
      
      <div class="footer">
    
        <p>© ${new Date().getFullYear()} Diary. All rights reserved.</p>
       
      </div>
    </div>
  </body>
  </html>
  `
    };
    await transporter.sendMail(mailOptions);

    req.flash('success', 'Password reset link sent to your email');
    res.redirect('/forgot-password');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'Error processing your request');
    res.redirect('/forgot-password');
  }
});

// Reset Password - Show form
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired');
      return res.redirect('/forgot-password');
    }

    res.render('./users/reset-password', {
      title: 'Reset Password',
      token: req.params.token,
      error: req.flash('error')
    });

  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'Error processing your request');
    res.redirect('/forgot-password');
  }
});



router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    // Validate input
    if (!password || !confirmPassword) {
      req.flash('error', 'Please fill in all fields');
      return res.redirect(`/reset-password/${token}`);
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect(`/reset-password/${token}`);
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/reset-password/${token}`);
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired. Please request a new one.');
      return res.redirect('/forgot-password');
    }

    // Set new password
    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    try {
      await transporter.sendMail({
        to: user.email,
        from: `"DIARY-WEB-APP"<${process.env.EMAIL_FROM}>`,
        subject: 'Your Diary password has been updated',
        html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #f8f9fa;
      }
      .container {
        padding: 30px;
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .header {
        text-align: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eaeaea;
      }
      .logo {
        font-size: 24px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      .divider {
        height: 1px;
        background: #eaeaea;
        margin: 25px 0;
      }
      .confirmation-icon {
        text-align: center;
        color: #27ae60;
        font-size: 48px;
        margin: 15px 0;
      }
      .content {
        margin: 20px 0;
      }
      .email-address {
        font-weight: 600;
        color: #2c3e50;
      }
      .security-note {
        background-color: #f8f9fa;
        padding: 15px;
        border-left: 3px solid #e74c3c;
        margin: 20px 0;
        font-size: 14px;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        font-size: 12px;
        color: #7f8c8d;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Diary</div>
        <div style="font-size: 14px; color: #7f8c8d;">Secure Story Writing Platform</div>
      </div>

      <div class="confirmation-icon">✓</div>
      
      <h2 style="font-size: 20px; color: #2c3e50; text-align: center; margin-bottom: 20px;">
        Password Successfully Updated
      </h2>
      
      <div class="content">
        <p>Hello,</p>
        
        <p>This confirms that the password for your Diary account <span class="email-address">${user.email}</span> was changed on ${new Date().toLocaleDateString()}.</p>
        
        <div class="security-note">
          <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately at <a href="mailto:support@diary.com" style="color: #2980b9;">support@diary.com</a>.
        </div>
        
     
      </div>
      
      <div class="divider"></div>
      
      <p style="margin-bottom: 0;">Thank you,</p>
      <p style="margin-top: 5px; font-weight: 600;">The Diary Team</p>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Diary. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);

    }

    req.flash('success', 'Password updated successfully! You can now login with your new password.');
    res.redirect('/login');

  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'An error occurred while resetting your password. Please try again.');
    res.redirect(`/reset-password/${req.params.token}`);
  }
});


//signup form
router.get('/signup', (req, res) => {
  res.render('./users/signup.ejs')
})

// login form
router.get("/login", (req, res) => {
  res.render('./users/login.ejs')
})


// Email transporter 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check email existence endpoint
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Show "Verification Email Sent" page
router.get('/verification-sent', (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect('/signup');

  res.render('./users/verification-sent', {
    title: 'Verification Email Sent',
    email,
    success: req.flash('success'),
    error: req.flash('error')
  });
});

// Show "Verification Success" page
router.get('/verification-success', (req, res) => {
  res.render('./users/verification-success', {
    title: 'Email Verified',
    success: req.flash('success'),
    error: req.flash('error')
  });
});


router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Username is required',
        exists: false
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.json({
        exists: true,
        message: 'Username already taken'
      });
    }

    res.json({
      exists: false,
      message: 'Username is available'
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({
      error: 'Error checking username availability',
      exists: false
    });
  }
});

// Enhanced signup route
router.post('/signup', async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const unverifiedUser = await User.findOne({
      email,
      isVerified: false
    });

    if (unverifiedUser) {

      req.flash('error', 'This email is already registered but not verified. Check your email or request a new verification link.');
      return res.redirect('/signup');
    }


    const verifiedUser = await User.findOne({
      email,
      isVerified: true
    });

    if (verifiedUser) {
      req.flash('error', 'Email already in use by a verified account.');
      return res.redirect('/signup');
    }


    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user = new User({
      name,
      username,
      email,
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    const registeredUser = await User.register(user, password);

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.headers.host}/verify-email?token=${verificationToken}`;
    const mailOptions = {
      to: email,
      from: `"DIARY-WEB-APP" <${process.env.EMAIL_USER}>`,
      subject: '🔐 Verify Your Email for Diary',
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        padding: 30px;
        text-align: center;
        color: white;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .tagline {
        opacity: 0.9;
        font-size: 14px;
      }
      .content {
        padding: 40px;
      }
      .title {
        font-size: 22px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: white !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 25px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .button:hover {
        background: linear-gradient(135deg, #6d28d9, #4338ca);
      }
      .link-box {
        background: #f1f5f9;
        padding: 16px;
        border-radius: 8px;
        word-break: break-all;
        font-size: 14px;
        color: #334155;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #64748b;
        font-size: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .username {
        font-weight: 600;
        color: #1e293b;
      }
      .security-note {
        background: #fff7ed;
        padding: 12px;
        border-left: 4px solid #f97316;
        border-radius: 0 4px 4px 0;
        margin: 20px 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Diary</div>
        <div class="tagline">Your stories, beautifully kept</div>
      </div>

      <div class="content">
        <h2 class="title">Verify Your Email</h2>
        <p>Hello <span class="username">${name}</span>,</p>
        <p>Welcome to Diary! To complete your registration, please verify your email address by clicking the button below:</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email</a>
        </div>

        <p>Or copy this link into your browser:</p>
        <div class="link-box">${verificationUrl}</div>

        <div class="security-note">
          <strong>Note:</strong> This link expires in <strong>24 hours</strong>. If you didn't request this, please ignore this email.
        </div>

        <p>Happy writing!<br>The Diary Team</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Diary. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `

    };

    await transporter.sendMail(mailOptions);

    res.redirect(`/verification-sent?email=${encodeURIComponent(email)}`);

  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed. Please try again.';
    if (error.message.includes('Email already in use')) {
      errorMessage = 'Email already in use. Please use a different email.';
    } else if (error.name === 'UserExistsError') {
      errorMessage = 'A user with the given username / email is already registered';
    }

    req.flash('error', errorMessage);
    res.redirect('/signup');
  }
});

// Enhanced verify-email route
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      req.flash('error', 'No verification token provided.');
      return res.redirect('/signup');
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Verification token is invalid or has expired. Please register again.');
      return res.redirect('/signup');
    }


    if (user.isVerified) {
      req.flash('info', 'This email is already verified. Please log in.');
      return res.redirect('/login');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    req.flash('success', 'Email verified successfully! You can now log in.');
    res.redirect('/verification-success');

  } catch (error) {
    console.error('Verification error:', error);
    req.flash('error', 'Email verification failed.');
    res.redirect('/signup');
  }
});

//Enhanced resend verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Email is required.');
      return res.redirect('/signup');
    }

    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'No account found with this email.');
      return res.redirect('/signup');
    }

    if (user.isVerified) {
      req.flash('info', 'This email is already verified. Please log in.');
      return res.redirect('/login');
    }


    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send email
    const verificationUrl = `${req.protocol}://${req.headers.host}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      to: email,
      from: `"DIARY-WEB-APP" <${process.env.EMAIL_USER}>`,
      subject: '🔐 Verify Your Email for Diary',
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        padding: 30px;
        text-align: center;
        color: white;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .tagline {
        opacity: 0.9;
        font-size: 14px;
      }
      .content {
        padding: 40px;
      }
      .title {
        font-size: 22px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: white !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 25px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .button:hover {
        background: linear-gradient(135deg, #6d28d9, #4338ca);
      }
      .link-box {
        background: #f1f5f9;
        padding: 16px;
        border-radius: 8px;
        word-break: break-all;
        font-size: 14px;
        color: #334155;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #64748b;
        font-size: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .username {
        font-weight: 600;
        color: #1e293b;
      }
      .security-note {
        background: #fff7ed;
        padding: 12px;
        border-left: 4px solid #f97316;
        border-radius: 0 4px 4px 0;
        margin: 20px 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Diary</div>
        <div class="tagline">Your stories, beautifully kept</div>
      </div>

      <div class="content">
        <h2 class="title">Verify Your Email</h2>
        <p>Hello <span class="username">${user.name}</span>,</p>
        <p>Welcome to Diary! To complete your registration, please verify your email address by clicking the button below:</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email</a>
        </div>

        <p>Or copy this link into your browser:</p>
        <div class="link-box">${verificationUrl}</div>

        <div class="security-note">
          <strong>Note:</strong> This link expires in <strong>24 hours</strong>. If you didn't request this, please ignore this email.
        </div>

        <p>Happy writing!<br>The Diary Team</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Diary. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `
    };

    await transporter.sendMail(mailOptions);

    req.flash('success', 'New verification email sent. Please check your inbox.');
    res.redirect(`/verification-sent?email=${encodeURIComponent(email)}`);

  } catch (error) {
    console.error('Resend verification error:', error);
    req.flash('error', 'Failed to resend verification email.');
    res.redirect('/signup');
  }
});

router.get('/resend-verification', async (req, res) => {
  try {
    const email = req.session.unverifiedEmail;
    if (!email) {
      req.flash('error', 'No email found to resend verification');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    if (user.isVerified) {
      req.flash('info', 'This email is already verified');
      return res.redirect('/login');
    }

    // Generate new token
    user.verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.headers.host}/verify-email?token=${user.verificationToken}`;

    const mailOptions = {
      to: email,
      from: `"Diary" <${process.env.EMAIL_USER}>`,
      subject: '🔐 Verify Your Email for Diary',
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        padding: 30px;
        text-align: center;
        color: white;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .tagline {
        opacity: 0.9;
        font-size: 14px;
      }
      .content {
        padding: 40px;
      }
      .title {
        font-size: 22px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: white !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 25px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .button:hover {
        background: linear-gradient(135deg, #6d28d9, #4338ca);
      }
      .link-box {
        background: #f1f5f9;
        padding: 16px;
        border-radius: 8px;
        word-break: break-all;
        font-size: 14px;
        color: #334155;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #64748b;
        font-size: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .username {
        font-weight: 600;
        color: #1e293b;
      }
      .security-note {
        background: #fff7ed;
        padding: 12px;
        border-left: 4px solid #f97316;
        border-radius: 0 4px 4px 0;
        margin: 20px 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Diary</div>
        <div class="tagline">Your stories, beautifully kept</div>
      </div>

      <div class="content">
        <h2 class="title">Verify Your Email</h2>
        <p>Hello <span class="username">${user.name}</span>,</p>
        <p>Welcome to Diary! To complete your registration, please verify your email address by clicking the button below:</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email</a>
        </div>

        <p>Or copy this link into your browser:</p>
        <div class="link-box">${verificationUrl}</div>

        <div class="security-note">
          <strong>Note:</strong> This link expires in <strong>24 hours</strong>. If you didn't request this, please ignore this email.
        </div>

        <p>Happy writing!<br>The Diary Team</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Diary. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `
    };

    await transporter.sendMail(mailOptions);

    req.flash('success', 'Verification email resent. Please check your inbox.');
    res.redirect('/login');
  } catch (error) {
    console.error('Resend verification error:', error);
    req.flash('error', 'Failed to resend verification email');
    res.redirect('/login');
  }
});   

// router.post('/login',
//   passport.authenticate('local', {
//     failureRedirect: '/login',
//     failureFlash: 'Invalid email or password'
//   }),
//   async (req, res, next) => {
//     if (!req.user.isVerified) {

//       const unverifiedEmail = req.user.email;

//       req.logout((err) => {
//         if (err) return next(err);

//         // Now set session and flash (after logout)
//         req.session.unverifiedEmail = unverifiedEmail;
//         const resendUrl = '/resend-verification';
//         const errorMessage = `Your account is not verified. <a href="${resendUrl}" class="font-medium underline hover:text-blue-700">Resend verification email</a>`;

//         req.flash('error', errorMessage);
//         return res.redirect('/login');
//       });
//       return;
//     }

//     req.flash('success', 'Login successful!');
//     res.redirect('/stories');
//   }
// );
router.post('/login',
  // Store original request data in session in case we need to redirect back
  (req, res, next) => {
    req.session.loginFormData = {
      email: req.body.email
    };
    next();
  },
  
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid email or password'
  }),
  
  async (req, res, next) => {
    try {
      if (!req.user.isVerified) {
        const unverifiedEmail = req.user.email;
        
        // Create verification link with token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        req.user.verificationToken = verificationToken;
        req.user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await req.user.save();
        
        // Send verification email
        const verificationUrl = `${req.protocol}://${req.headers.host}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
          to: unverifiedEmail,
          from: `"Your App" <${process.env.EMAIL_USER}>`,
          subject: 'Complete Your Registration',
          html: `Please verify your email by clicking <a href="${verificationUrl}">here</a>`
        });
        
        // Logout and show message
        req.logout((err) => {
          if (err) return next(err);
          
          req.flash('error', 
            `Your account is not verified. We've sent a new verification link to ${unverifiedEmail}. ` +
            `Check your email or <a href="/resend-verification" class="font-medium underline hover:text-blue-700">request another</a>.`
          );
          
          // Clear the stored form data since we're handling it
          delete req.session.loginFormData;
          return res.redirect('/login');
        });
        return;
      }
      
      // Clear the stored form data on successful login
      delete req.session.loginFormData;
      
      req.flash('success', 'Login successful! Welcome back.');
      return res.redirect('/stories');
      
    } catch (err) {
      // Clear the stored form data on error
      delete req.session.loginFormData;
      return next(err);
    }
  }
);

// In your GET /login route, make sure to pass the form data back:
router.get('/login', (req, res) => {
  const formData = req.session.loginFormData || {};
  delete req.session.loginFormData; // Clear after using
  
  res.render('login', {
    error: req.flash('error'),
    success: req.flash('success'),
    email: formData.email
  });
});
// Logout route remains the same
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      req.flash('success', 'Logged out successfully');
          req.session.save(() => {
      res.redirect('/stories');
          })
    }
  });
});

module.exports = router;

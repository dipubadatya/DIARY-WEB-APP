
const express=require('express')
const router=express.Router()
const passport = require('passport')
const User=require('../models/users')
const Comments=require('../models/comment')
const Stories=require('../models/stories')
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const flash = require('connect-flash');
const axios= require('axios')
const { storage } = require('../cloudinary.js')
const Joi = require('joi');
const upload = multer({ storage })
const isLoggedIn = require('../middleware')
const validator=require('validator')





router.delete('/delete', isLoggedIn, async (req, res) => {
    try {
        let currUser=req.user._id
        const user = await User.findById(currUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne(); // Trigger pre middleware
        await Stories.deleteMany({ owner: currUser }); // Trigger pre middleware
        await Comments.deleteMany({ author: currUser }); // Trigger pre middleware

       res.redirect('/stories')
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err });
    }
});


//find following list
router.get('/following/:id',isLoggedIn,async(req,res)=>{
    let {id}=req.params
    let profile = await User.findById(id).populate('following').populate('followers')
    res.render('./users/following.ejs', { profile })
})

//find followers list

router.get('/followers/:id',isLoggedIn,async(req,res)=>{
    let {id}=req.params
    let profile = await User.findById(id).populate('following').populate('followers')

    res.render('./users/followers.ejs', { profile })

})

// router.get('/notification',isLoggedIn,async(req,res)=>{
//     let user = await User.findById(req.user._id).populate('stories').populate({
//         path: 'notifications.fromUser',
//         select: 'username name image' 
//     });

//     res.render('./stories/notification.ejs',{user})
// })
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

// router.get('/notification', isLoggedIn, async (req, res) => {
//     let user = await User.findById(req.user._id).populate({
//         path: 'notifications.fromUser',
//         select: 'username name image'
//     });

//     if (!user) {
//         req.flash("error", "User not found.");
//         return res.redirect("/");
//     }
//     user.notifications.forEach(notif => notif.read = true);
//     const notifications = user.notifications.reverse(); 
//     // Date filters
  

//     res.render('./stories/notification.ejs', { 
       
//         user
//     });
// });
const moment = require('moment');

// router.get('/notification', isLoggedIn, async (req, res) => {
//     let user = await User.findById(req.user._id).populate({
//         path: 'notifications.fromUser',
//         select: 'username name image'
//     });

//     if (!user) {
//         req.flash("error", "User not found.");
//         return res.redirect("/");
//     }

//     user.notifications.forEach(notif => notif.read = true);

//     // Grouping logic
//     let today = [];
//     let yesterday = [];
//     let last7Days = [];
    
//     let currentDate = moment().startOf('day'); // Today at 00:00
//     let yesterdayDate = moment().subtract(1, 'days').startOf('day'); // Yesterday at 00:00
//     let sevenDaysAgo = moment().subtract(7, 'days').startOf('day'); // 7 days ago at 00:00

//     user.notifications.forEach(notif => {
//         let notifDate = moment(notif.timeStamp);

//         if (notifDate.isSame(currentDate, 'day')) {
//             today.push(notif);
//         } else if (notifDate.isSame(yesterdayDate, 'day')) {
//             yesterday.push(notif);
//         } else if (notifDate.isAfter(sevenDaysAgo)) {
//             last7Days.push(notif);
//         }
//     });

//     res.render('./stories/notification.ejs', { 
//         user,
//         today,
//         yesterday,
//         last7Days
//     });
// });
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
    await user.save();  // Save the updated read status

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
        const userId = req.user._id; // Assuming you store the logged-in user in req.user
        const { notifId } = req.params;

        // Find the user and remove the notification by filtering
        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/notification");
        }

        // Filter out the notification
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
router.get('/dashbord',isLoggedIn, async (req, res) => {
    let user = await User.findById(req.user._id).populate('stories').populate({
        path: 'notifications.fromUser',
        select: 'username name' 
    });

    const pageTitle = `Welcome to Your Dashboard, ${user.name}`;
    const pageDescription = `View your latest activities, stats, and notifications on your personalized dashboard.`;
    res.render('./users/dashbord.ejs', { user , pageTitle,pageDescription})
})


//edit user dashbord
router.put('/dashbord/:id',isLoggedIn, upload.single('dashbord[image]'), async (req, res) => {
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


//profile banner edit
// router.put('/profile/:id/banner', isLoggedIn,upload.single('image'), async (req, res) => {
//     let { id } = req.params
//     let user = await User.findById(id)

//     if (typeof req.file !== 'undefined') {
//         let url = req.file.path
//         let filename = req.file.originalname
//         user.banner = { url, filename }
//         await user.save()
//     }
//     res.redirect(`/profile`)

// })
// Update your banner route to handle the filtered and cropped image
router.put('/profile/:id/banner', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if this is an XHR request (from our JavaScript)
        const isXHR = req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (typeof req.file !== 'undefined') {
            const url = req.file.path;
            const filename = req.file.originalname;
            
            user.banner = { url, filename };
            await user.save();
            
            // If it's an XHR request, send JSON response
            if (isXHR) {
                return res.json({ 
                    success: true, 
                    message: 'Banner image updated successfully',
                    imageUrl: url
                });
            }
        }
        
        // Regular form submission response
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating banner image:', error);
        
        // Handle errors based on request type
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(500).json({ error: 'Failed to update banner image' });
        }
        
        res.redirect('/profile');
    }
});

// profile picture edit
// router.put('/profile/:id/image',isLoggedIn, upload.single('prof-image'), async (req, res) => {
//     let { id } = req.params
//     let user = await User.findById(id)

//     if (typeof req.file !== 'undefined') {
//         let url = req.file.path
//         let filename = req.file.originalname
//         user.image = { url, filename }
//         await user.save()
//     }
//     res.redirect(`/profile`)
// })

// Update your route to handle the filtered and cropped image
router.put('/profile/:id/image', isLoggedIn, upload.single('prof-image'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {npm
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if this is an XHR request (from our JavaScript)
        const isXHR = req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (typeof req.file !== 'undefined') {
            const url = req.file.path;
            const filename = req.file.originalname;
            
            user.image = { url, filename };
            await user.save();
            
            // If it's an XHR request, send JSON response
            if (isXHR) {
                return res.json({ 
                    success: true, 
                    message: 'Profile image updated successfully',
                    imageUrl: url
                });
            }
        }
        
        // Regular form submission response
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile image:', error);
        
        // Handle errors based on request type
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(500).json({ error: 'Failed to update profile image' });
        }
        
        res.redirect('/profile');
    }
});
router.put('/profile/:id/delete',isLoggedIn,async(req,res)=>{
    let {id}=req.params
    console.log(id)
  let user= await User.findById(id);
       user.banner={ url:'',filename:''}
      await user.save()
        res.redirect(`/profile`)
})



//current user profile
router.get('/profile',isLoggedIn, async (req, res) => {
    const currUser=req.user
    const user=req.user
  
  
      let profile = await User.findById(currUser).populate('stories')
     
      const pageTitle = `${profile.username}'  s Profile`;
      const pageDescription = `View and edit your profile information including personal details, preferences, and more.`;
      res.render('./users/account.ejs', { profile ,user,pageTitle,pageDescription})
  })
  
// other user profiles
router.get('/profile/:id',isLoggedIn, async (req, res) => {
    let { id } = req.params
    const user=req.user


    let profile = await User.findById(id).populate('stories')
    const pageTitle = `${profile.username}'   s Profile`;
    const pageDescription = `View and edit your profile information including personal details, preferences, and more.`;

    res.render('./users/account.ejs', { profile,user,pageTitle,pageDescription })
})

router.post('/follow/:id', async (req, res) => {
    try {
        const { id } = req.params; // ID of the user to be followed
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
        const { id } = req.params; // ID of the user to be unfollowed
        const currentUserId = req.user._id; 

        // Find both users
        const userToUnfollow = await User.findById(id);
        const currentUser = await User.findById(currentUserId);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from followers and following lists
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


//signup form
router.get('/signup',(req,res)=>{
    res.render('./users/signup.ejs')
})




router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (user) {
            // Email exists
            res.json({ exists: true });
        } else {
            // Email does not exist
            res.json({ exists: false });
        }
    } catch (err) {
        console.error('Error checking email:', err);
        res.status(500).json({ exists: false });
    }
});




//user registration
router.post('/signup', async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;

   
    
 
        // Create user and register
        const user = new User({ name, username, email });
       
        const registerUser = await User.register(user, password);
      
        req.login(registerUser, (err) => {
            if (err) return next(err);
            req.flash('success', 'SignUp successful!');
            res.redirect('/stories');
        });
        
    } catch (error) {
      
        req.flash('error', 'User already exists ');
        res.redirect('/signup');
    }
});



// login form
router.get("/login", (req, res) => {
    res.render('./users/login.ejs')
})


//login route
router.post('/login', passport.authenticate('local', {
    failureRedirect: "/login",
    failureFlash: true
}), async (req, res) => {

    req.flash("success", "Login Successfull!")
    res.redirect('/stories')
}
)


//logout route
router.get('/logout', (req, res) => {

    req.logout((err) => {
        if (err) {
            return next(err)

        } else {

            req.flash("success", "logged out")
            res.redirect('/stories')
        }
    })

})

module.exports=router;
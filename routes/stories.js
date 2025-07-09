
// module.exports = router
require('dotenv').config();
const express = require('express');
const router = express.Router();
const Stories = require('../models/stories.js');
const Message = require('../models/message.js');
const User = require('../models/users');
const fs = require('fs');
const isLoggedIn = require('../middleware');

const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const moment = require('moment');
const {validateStory, validateStoryUpdate }=require('../validation/storiesValidation')


const handleError = (res, error, message = 'Internal Server Error', status = 500) => {
    console.error(message, error);
    res.status(status).json({ error: message });
};


// user search page
router.get('/search', (req, res) => {
    res.render('./stories/search');
});



router.get('/username/:query', async (req, res) => {
    try {
        const regex = new RegExp(req.params.query, 'i');
        const users = await User.find({
            $or: [
                { username: regex },
                { name: regex }
            ]
        }).limit(10); 
        res.json(users);
    } catch (error) {
        handleError(res, error, 'Problem searching users');
    }
});


 // Get stories with unread counts
router.get('/stories', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const categoryQuery = req.query.category || '';
    const sortQuery = req.query.sort || '';

    let filter = {};

    if (searchQuery) filter.title = { $regex: searchQuery, $options: 'i' };
    if (categoryQuery && categoryQuery !== '') filter.category = categoryQuery;

    let sort = { timeStamp: -1 };
    if (sortQuery === 'oldest') sort = { timeStamp: 1 };

    let unreadCounts = {};
    if (req.user && req.user._id) {
      try {
        const unseenMessages = await Message.find({
          receiver: req.user._id,
          status: { $in: ['delivered', 'sent'] } 
        });

        unseenMessages.forEach(msg => {
          const senderId = msg.sender.toString();
          unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
        });
      } catch (err) {
        console.error('Error loading unread messages:', err);
      }
    }

    const storyData = await Stories.find(filter)
      .sort(sort)
      .populate({ path: 'comments', populate: { path: 'author' } })
      .populate('owner')
      .exec();

    res.render('./stories/storyList.ejs', { 
      storyData, 
      user: req.user || null,
      unreadCounts: Object.keys(unreadCounts).length > 0 ? unreadCounts : null,
      lastChecked: Date.now()
    });
  } catch (error) {
    console.error('Error in /stories route:', error);
    handleError(res, error, 'Problem fetching stories');
  }
});
 


// Check unread messages count
router.get('/check-unread-messages', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      status: { $in: ['delivered', 'sent'] }
    });

    res.json({
      success: true,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error checking unread messages:', error);
    res.status(500).json({ error: 'Failed to check unread messages' });
  }
});

  

// Mark messages as seen
router.post('/mark-messages-seen', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Message.updateMany(
      {
        receiver: req.user._id,
        status: { $in: ['delivered', 'sent'] }
      },
      { $set: { status: 'seen', seenAt: new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});  
     

// check for unread messages
router.get('/api/unread-count', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const lastChecked = new Date(parseInt(req.query.lastChecked) ) || 0;
    
    const unreadCounts = {};
    const unseenMessages = await Message.find({
      receiver: req.user._id,
      status: { $in: ['delivered', 'sent'] }
    });

    unseenMessages.forEach(msg => {
      const senderId = msg.sender.toString();
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
    });

    res.json({
      unreadCounts,
      lastChecked: Date.now()
    });
  } catch (error) {
    console.error('Error checking unread messages:', error);
    res.status(500).json({ error: 'Failed to check unread messages' });
  }
});
 
// Render new story form
router.get('/stories/newWrite', loggedIn, (req, res) => {
    res.render('./stories/writer.ejs');
});



// Fetch a single story by ID
router.get('/stories/:id', loggedIn, async (req, res) => {
    try {
  
        const { id } = req.params;
        const user = req.user;
        const story = await Stories.findById(id)
            .populate({ path: 'comments', populate: { path: 'author' } })
            .populate('owner');

        if (!story) {
            return res.status(404).send('Story not found');
        }

        if (user && !story.views.includes(user._id)) {
            story.views.push(user._id);
            await story.save();
        }
        const pageTitle = `${story.title}`;
        const pageDescription = `${story.story || story.story.substring(0, 160)}...`; 
        res.render('./stories/storyRead.ejs', { story, user,pageTitle,pageDescription });
    

    } catch (error) {
        handleError(res, error, 'Problem fetching story');
    }
});




// Create a new story
router.post('/stories', upload.single('image'),validateStory, async (req, res) => {
    try {
        const userid = req.user._id;
        const { title, story , category } = req.body;
        // const plainText = convert(story); // Convert HTML to plain text
 
        
        const newStory = new Stories({ title, story , category});
        newStory.owner = userid;
        newStory.image = {
            url: req.file.path,
            filename: req.file.filename,
            publicId: req.file.filename,
        };

        const user = await User.findById(userid);
        user.stories.push(newStory._id);

        await newStory.save();
        await user.save();
 
        req.flash('success', 'your story is live!');
        res.redirect('/stories');
    } catch (error) {
        handleError(res, error, 'Error creating story');
        res.redirect('/stories/newWrite');
    }
});


router.get('/stories/:id/likes', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Stories.findById(id).populate('owner'); 
        const userId = req.user._id;
        const alreadyLiked = post.likedBy.includes(userId);

        if (alreadyLiked) {
            post.likedBy.pull(userId);
            post.likesCounts -= 1;
        } else {
            post.likedBy.push(userId);
            post.likesCounts += 1;


            if (!post.owner._id.equals(userId)) {
                post.owner.notifications.push({
                    type: "like",
                    fromUser: userId,
                    storyId: post
                });
                await post.owner.save();
            }
        }

        await post.save();

        if (!alreadyLiked) {
            req.flash('success', 'You liked the story!');
        }
        
        res.redirect(`/stories/${id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Problem updating likes" });
    }
});



// Render edit story form
router.get('/stories/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const editStory = await Stories.findById(id);
        res.render('./stories/editStory.ejs', { editStory });
    } catch (error) {
        handleError(res, error, 'Problem fetching story for edit');
    }
});

// Update a story
router.put('/stories/:id', upload.single('editStory[image]'),validateStoryUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, story , category } = req.body;
        // const plainText = convert(story); 
   
        const editStory = await Stories.findByIdAndUpdate(id, { title, story , category});
        editStory.editedAt = new Date();

        if (req.file) {
            editStory.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        await editStory.save();
        req.flash('success', ' Your story is now up to date.');
        res.redirect(`/stories/${id}`);
    } catch (error) {
        handleError(res, error, 'Error updating story');
    }
});


// stories pdf download
router.get('/stories/download/:id', async (req, res) => {
    try {
        const story = await Stories.findById(req.params.id);
        if (!story) {
            return res.status(404).send('Story not found');
        }

        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));

       
        doc.font('Helvetica').fontSize(12).text(story.title, { align: 'center', encoding: 'utf-8' }).moveDown();

        
        const normalizedText = story.story.replace(/\r?\n/g, '\n').trim();
        doc.fontSize(12).text(normalizedText, { encoding: 'utf-8' });

        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${story.title}.pdf"`);
            res.send(pdfData);
        });

        doc.end();
    } catch (error) {
        handleError(res, error, 'Error generating PDF');
    }
});

// Delete a story
router.delete('/stories/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Stories.findById(id).populate('owner');

        if (!story) {
            return res.status(404).send('Story not found');
        }

        if (!story.owner._id.equals(req.user._id)) {
            return res.status(403).send('You are not the owner');
        }

        if (story.image.publicId) {
            await cloudinary.uploader.destroy(story.image.publicId);
        }

        await Stories.findByIdAndDelete(id);

        req.flash('success', 'Story deleted!');
       return res.redirect('/stories');
    } catch (error) {
        handleError(res, error, 'Error deleting story');
    }
});


module.exports = router;

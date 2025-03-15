const express=require('express');
const router=express.Router();
const Comments=require('../models/comment')
const Stories=require('../models/stories')
const User=require('../models/users');
const { render } = require('ejs');
const giphy = require('giphy-api')(process.env.GIPHY_API_KEY);

//comment route
router.post('/comment/:id', async (req, res) => {
    try {
        const  {id} = req.params;
        const story = await Stories.findById(id);    
        let newComment= new Comments(req.body.comment)
            
            newComment.author=req.user._id
            console.log(newComment.author)
            
                story.comments.push(newComment) 
            await newComment.save()
         
            await story.save()

        req.flash('success', 'comment added');
     res.redirect(`/stories/${id}`);
    } catch (error) {
        console.error('Error coment story:', error);
        res.status(500).send('Internal Server Error comment');
    }
});


//gif route
router.post('/gif/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Stories.findById(id);
      
        
        let newComment = new Comments({
         
            gif: req.body.gif || '', // Store GIF URL
            author: req.user._id
        });

        story.comments.push(newComment);
        await newComment.save();
        await story.save();
       req.flash('success','gif added!')
        res.redirect(`/stories/${id}`);
    } catch (error) {
        console.error('Error commenting on story:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to search GIFs
router.get('/search-gif', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await giphy.search({
            q,
            limit: 100
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching GIFs:', error);
        res.status(500).json({ error: 'Failed to fetch GIFs' });
    }
});

//comment edit form
router.get('/comment/:storyId/review/:commentId',async(req,res)=>{
  const{storyId,commentId}=req.params
    
 
  
  const comments= await Comments.findById(commentId).populate('author');
  const story= await Stories.findById(storyId);
  console.log(comments)
  res.render('./stories/commentEdit',{comments,story})
})


//comment edit route
router.put('/review/:commentId/story/:storyId', async(req,res)=>{
    try {
        const {commentId,storyId}=req.params;
          const comment=req.body.comment
       
          
        let review=await Comments.findByIdAndUpdate(commentId,{comment});

        
        await review.save();
        req.flash('success','Comment edited successfully!');
        res.redirect(`/stories/${storyId}`)
    } catch (error) {
        console.error('error update comment:',error);
        
    }
  
    
})

//user profile route
router.get('/comment/:id',async(req,res)=>{
    let{id}=req.params
   
    
    const profile= await User.findById(id).populate('stories')
    console.log(profile);
    
    res.render('./users/account.ejs',{profile})

})

// comment delete route
router.delete('/comment/:id/review/:commentId',async(req,res)=>{
    try {
        
        const {id,commentId}=req.params;
        
        const review = await Comments.findById(commentId);
        if (!review.author._id.equals(req.user._id)) {
            console.log('you are not a owner');
          


            res.redirect(`/stories/${id}`)
            }else{
                await Stories.findByIdAndUpdate(id,{$pull:{comments:commentId}})
                await Comments.findByIdAndDelete(commentId);

                
              req.flash('success','Comment deleted !'); 
               return res.redirect(`/stories/${id}`)
                
            }
          
    } catch (error) {
        console.error('Error deleting review:', error);
    }
})



module.exports=router
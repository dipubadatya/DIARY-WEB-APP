const { timeStamp } = require('console')
const mongoose = require('mongoose')
const { type } = require('os')
const Comment=require('./comment.js') 



const storySchema = mongoose.Schema({
       title: {
              type: String,
              Required: true
       },
       image: {
              url:String,
              filename:String,
             publicId:String

       },
       story: {
              type: String,
              Required: true
       }, timeStamp:{
              type: Date,
             default: Date.now

          },
          editedAt:{
                type:Date,
          },
     category:{
        type:String,
        enum:[
            'fantasy',
            'random-thoughts',
            'poetry',
            'sci-fi',
            'romance',
            'mystery',
            'horror',
            'drama',
            'adventure',
            'historical',
            'comedy',
            'ya',
            'children',
            'fanfiction',
            'other',
               
        ]
     },
       owner: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
       },
      
           likedBy:[{ type: mongoose.Schema.Types.ObjectId,ref: "User"}],
           likesCounts:{type:Number, default:0 },
            
             
         
      
       views: [
              {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User", 
              }
          ],
          comments: [
              {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Comment", 
              }
          ],
        
})

// Middleware to remove the story reference from the user's stories array
storySchema.post('findOneAndDelete', async function (story) {
    if (story) {          
   
        await mongoose.model('User').updateOne(
            { _id: story.owner },
            { $pull: { stories: story._id } }
        );

        // Delete associated comments
        await Comment.deleteMany({ _id: { $in: story.comments } });
    }
});

module.exports = mongoose.model('Story', storySchema)              
                            

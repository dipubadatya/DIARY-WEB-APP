const mongoose=require('mongoose')
const passportLocalMongoose=require("passport-local-mongoose")
const Stories=require('../models/stories')
const Comments=require('../models/comment')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
        },
        email:{
            type:String,
        required:true
        },
      
        image:{
            url:{
                type:String,
                default: "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o="
            },
            filename:{
                type:String,
                default:'profile_iamge'
            },
           publicId:{
            type:String,
           }
           
        },
        banner:{
            url:{
            type:String,default:'https://i.pinimg.com/736x/7c/05/b9/7c05b92ca71023ebde50496547407ac5.jpg'
            },
            filname:{
                type:String,
                default:'profile_iamge'
            }
        },
        bio:{
            type:String,
        },
        stories:[ {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Story",
     }],

     followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    notifications: [
        {
            type: {
                type: String, // "like" or "follow"
                enum: ["like", "follow"],
                required: true
            },
            fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stories', default: null },
            timeStamp:{
                type: Date,
                default: Date.now
                // default: () => new Date() 
             },
            read: { type: Boolean, default: false }
        }
    ]
    
})


// userSchema.plugin(passportLocalMongoose,)
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
module.exports=mongoose.model('User',userSchema) 

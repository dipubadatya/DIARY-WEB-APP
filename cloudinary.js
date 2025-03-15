require('dotenv').config()
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');



cloudinary.config({
cloud_name: process.env.CLOUD_NAME,
api_key: process.env.CLOUD_API_KEY,
api_secret: process.env.CLOUD_SECRET,
secure: true,
})



const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "diary_web",
      // timestamp:Math.round((new Date()).getTime() / 1000),

      formats: ["png","jpg","jpeg"], 
    },
  
  });


  module.exports={
    cloudinary,storage,
  }



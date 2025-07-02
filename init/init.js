const mongoose =require('mongoose')

const Message=require('../models/message')



async function init() {
    try {
      // 1. First connect to MongoDB
      await mongoose.connect('mongodb+srv://pstar123:pstar123@diary-web.4zdhd.mongodb.net/?retryWrites=true&w=majority&appName=DIARY-WEB', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
  
      console.log('Connected to MongoDB');
  
      // 2. Then perform deletion
      const result = await Message.deleteMany({});
      console.log(`Deleted ${result.deletedCount} users`);
  
    } catch (err) {
      console.error('Error:', err);
    } finally {
      // 3. Close the connection when done
      await mongoose.connection.close();
      console.log('Connection closed');
    }
  }
  
  init();
  
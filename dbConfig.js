const mongooseConnect = require("mongoose-connect");
const mongoose= require('mongoose')
require('dotenv').config()
  
                    



let dbUrl = process.env.MONGO_ATLAS

// let dbUrl = process.env.MONGO_LOCAL

module.exports= async function main() {
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then(
        console.log('database connected')
    ).catch()
    
}

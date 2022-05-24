const mongoose = require('mongoose');
require('dotenv').config();

const URL = process.env.MONGODB_URL || "mongodb://localhost:27017/blog";

module.exports = {
    connect: ()=>mongoose.connect(URL).then(()=>console.log("Database Connected!"))
}
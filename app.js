const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./config/db.js');
require('dotenv').config();

//register schema
require('./model/user');
require('./model/subscription');
require('./model/passwordReset');

//middleware
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//routes
app.use("/user", require("./routes/user.js"))


//connect database
db.connect()

//connect server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`server running in PORT ${PORT}`))

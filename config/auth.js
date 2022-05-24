const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const auth = async(req, res, next)=>{
    try{
        //get access token from req.header
        const accesstoken = req.headers["authorization"].split(' ')[1]
        
        if(!accesstoken){
            return res.status(402).json({status: false, msg: "You are not authorized! Please login or register"})
        }
        else{
            //validate the accesstoken
            const jwtUser = await jwt.verify(accesstoken, process.env.JWT_ACCESS_SECRETE);
            if(!jwtUser){
                return res.status(402).json({status: false, msg: "You are not authorized! Please login or register"})
            }
            else{
                
                const user = await User.findOne({_id: jwtUser.id});
                if(!user){
                    return res.status(402).json({status: false, msg: "You have been removed. This may be due to not verifying your account for up to 72 hours. Please register again"})
                }
                //put id on req object
                req.user = jwtUser.id
                next()
            }
        }
    }
    catch(err){
        if(err.message == 'invalid signature' || err.message == 'invalid token'){
            return res.status(402).json({status: false, msg: "You are not authorized! Please login or register"})

        }else if(err.message == 'jwt expired'){
            return res.status(402).json({status: false, msg: "You are not authorized! Please login or register"})

        }else{
            return res.status(505).json({status: false, msg: err.message});
        }
    }
}

// "Server error! Please contact the admin"
module.exports = { auth };
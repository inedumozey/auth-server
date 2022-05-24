const mongoose = require('mongoose')
const User = mongoose.model('User');
const PasswordReset = mongoose.model('PasswordReset');
const bcrypt = require("bcrypt");
const createDOMPurify = require('dompurify');
const {JSDOM} = require('jsdom');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const verificationLink = require('../config/verificationLink');
const passResetLink = require('../config/passResetLink');
const filterUsers = require('../config/filterUsers')
require("dotenv").config();
const VERIFY_EMAILS = Boolean(process.env.VERIFY_EMAILS);

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

function generateAccesstoken(id){
    return jwt.sign({id}, process.env.JWT_ACCESS_SECRETE, {expiresIn: process.env.JWT_ACCESS_DURATION})
}

function generateRefreshtoken(id){
    return jwt.sign({id}, process.env.JWT_REFRESH_SECRETE, {expiresIn: process.env.JWT_REFRESH_DURATION})
}

const ran = {
    token: ()=>crypto.randomBytes(64).toString('base64url'),
    id: ()=>crypto.randomBytes(16).toString('hex'),
    resetToken: ()=>crypto.randomBytes(64).toString('base64url')
}

module.exports ={
    signup: async(req, res)=>{
        try{
            const data = {
                password:  DOMPurify.sanitize(req.body.password),
                cpassword: DOMPurify.sanitize(req.body.cpassword),
                username: DOMPurify.sanitize(req.body.username),
                email: DOMPurify.sanitize(req.body.email),
            }
            
            const { email, username, password, cpassword } = data;
            if(!email || !password || !cpassword){
                return res.status(400).json({status: false, msg: "Fill all required fields!"});
    
            }
            else if(password != cpassword){
                return res.status(405).json({status: false, msg: "Passwords do not match!"});
                
            }else{

                //check for already existed email and username
                const oldUser = await User.findOne({email});
                const oldUsername = await User.findOne({username});
                 
                if(oldUser){
                    return res.status(409).json({status: false, msg: "Email already exist!"});

                }
                if(oldUsername){
                    return res.status(409).json({status: false, msg: "Username already taken!"});

                }

                //hash the password
                const hashedPass = await bcrypt.hash(password, 10);
                
                //save data to database
                const user = new User({
                    email,
                    username,
                    token: VERIFY_EMAILS ? ran.token() : "",
                    isVerified: VERIFY_EMAILS ? false : true,
                    userId: ran.id(),
                    password: hashedPass
                })
            
                //send account activation link to the users
                if(VERIFY_EMAILS){
                    await user.save();
                    verificationLink(user, res)
                }else{
                    await user.save()
                    return res.status(200).json({status: true, msg: "Registration successfull", isVerified: user.isVerified})
                    
                }
            }
        }
        catch(err){
            return res.status(505).json({status: false, msg: err.message});
        }
    },

    resendVerificationLink: async(req, res)=>{
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
                        return res.status(402).json({status: false, msg: "Sorry! You have been removed. This may be due to not verifying your account for up to 72 hours. Please register again"})
                    }
                    if(user.isVerified){
                        return res.status(402).json({status: false, msg: "Your account has already been verified"})
                    }
                    //send account activation link to the users
                    verificationLink(user, res)
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
    },

    verifyAccount: async(req, res)=>{
        try{
             const {token} = req.query

             if(!token){
                return res.status(400).json({status: false, msg: "Token is missing!"})
             }else{
                 //search token in the database
                 const user = await User.findOne({token})
                 if(!user){
                    return res.status(400).json({status: false, msg: "Invalid token or you may have been removed due to not verifying your account for up to 72 hours. Please register again or resend link"})
                            
                 }else{
                    if(user.isVerified){
                        return res.status(200).json({status: true, msg: "Your account is already verified", isVerified: user.isVerified})
                    }

                    user.isVerified = true;
                    user.token = "";
                    setTimeout(async()=> await user.save(), 1000);

                    return res.status(200).json({status: true, msg: "Your account is verified", isVerified: user.isVerified})
                 }
             }
        }
        catch(err){
            return res.status(505).json({status: false, msg: "Server error! Please contact the admin"});
        }
    },

    signin: async(req, res)=>{
        try{
            const {email, password} = req.body;

            if(!email || !password){
                return res.status(400).json({status: false, msg: "All fields are required!"});

            }
            else{
                const user = await User.findOne({$or: [{email}, {username: email}]});
                
                if(!user){
                    return res.status(400).json({status: false, msg: "Invalid login credentials"});

                }else{
                    const match = await bcrypt.compare(password, user.password);

                    if(!match){
                        return res.status(400).json({status: false, msg: "Invalid login credentials"});

                    }else{
                        res.status(201).cookie("access", generateAccesstoken(user._id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});

                        res.status(201).cookie("refresh", generateRefreshtoken(user._id), {httOnly: true, maxAge:  Number(process.env.COOKIE_REFRESH_DURATION)});

                        return res.status(200).json({status: true, msg: "Your are logged in", isVerified: user.isVerified});
                    }
                }
            }
        }
        catch(err){
            return res.status(505).json({status: false, msg: err.message});
        }
    },

    refreshtoken: async(req, res)=>{
        try{
            //refresh token passed in req.body from client is used to refresh access token which will then be saved in client token
            const {token} = req.body;
            
            if(token){
                //validate token
                const data = await jwt.verify(token, process.env.JWT_REFRESH_SECRETE);
                
                if(!data){
                    res.status(400).json({status: false, msg: "Invalid token! Please login or register"});
                }
                else{
                    //generate new access token and send to client as cookie
                    const user = await User.findOne({_id: data.id});

                    res.status(201).cookie("access", generateAccesstoken(user.id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});
                    
                    res.status(201).json({status: false, msg: "Access token refreshed", isVerified: user.isVerified});
                }

            }else{
                res.status(400).json({status: false, msg: "User not authenticated! Please login or register"});
            }
        }
        catch(err){
            return res.status(505).json({status: false, msg: "Server error! Please contact the admin"});
        }
    },

    resetPassRequest: async(req, res)=>{
        try{
            const {email} = req.body;

            if(!email){
                return res.status(400).json({status: false, msg: "The field is required!"});

            }
            else{
                const user = await User.findOne({$or: [{email}, {username: email}]});
                if(!user){
                    return res.status(400).json({status: false, msg: "User not found! Please register"});

                }
                if(!user.isVerified){
                    return res.status(400).json({status: false, msg: "Your account is not verified"});
                }
                if(VERIFY_EMAILS){
                    // check passwordReset collection if user already exist, then update the toke
                    const oldUser = await PasswordReset.findOne({user: user._id})
                    
                    if(oldUser){
                        const passwordReset = await PasswordReset.findOneAndUpdate({user: user._id}, {$set: {token: ran.resetToken()}}, {new: true});
                        const data = {email: user.email, passwordReset}
                        passResetLink(data, res);

                    }
                    else{
                        // otherwise generate and save token and also save the user             
                        const passwordReset = new PasswordReset({
                            token: ran.resetToken(),
                            user: user._id
                        })

                        await passwordReset.save()
                        const data = {email: user.email, passwordReset}
                        passResetLink(data, res);
                    }
        
                }
                else{
                    return res.status(200).json({status: true, msg: "Reset your password"});
                }
                
            }
        }
        catch(err){
            return res.status(505).json({status: false, msg: err.message});
        }
    },

    resetPass: async(req, res)=>{
        try{
            const {token} = req.query;
            
            const data = {
                password:  DOMPurify.sanitize(req.body.password),
                cpassword: DOMPurify.sanitize(req.body.cpassword)
            }

            if(!data.password || !data.cpassword){
                return res.status(400).json({status: false, msg: "Fill all required fields!"});
    
            }
            if(data.password != data.cpassword){
                return res.status(405).json({status: false, msg: "Passwords do not match!"});
                
            }
            if(!token){
                return res.status(400).json({status: false, msg: "Token is missing!"})

            }

            //search token in the database
                
            const token_ = await PasswordReset.findOne({token});

            if(!token_){
                return res.status(400).json({status: false, msg: "Invalid token"})
            }
                    
            //use the token to find the user
            const user = await User.findOne({_id: token_.user})
            if(!user){
                return res.status(400).json({status: false, msg: "User not found; you may have been removed due to not verifying your account for up to 72 hours. Please register again"});
            }
            
            if(!user.isVerified){
                return res.status(400).json({status: false, msg: "Your account is not verified"});
            }
            
            // 1. remove the token from PasswordReset model
            await PasswordReset.findOneAndUpdate({user: token_.user}, {$set: {token: ""}})
            
            // 2. update user model with password
            const hashedPass = await bcrypt.hash(data.password, 10);
            const u = await User.findOneAndUpdate({_id: token_.user}, {$set: {password: hashedPass}}, {new: true})
            
            return res.status(200).json({status: true, msg: "Password Changed"})
        }   
        catch(err){
            return res.status(505).json({status: false, msg: err.message});
        }
    },

    removeUnverifiedUser: async(req, res)=>{
        try{
            //remove all unverified users after 72 hours
            filterUsers.removeUnVerifiedUsers();
            res.json({status: true, msg: "success"})
        }
        catch(err){
            res.json({status: false, msg: "Server error, please contact us!"})
        }
    }
}


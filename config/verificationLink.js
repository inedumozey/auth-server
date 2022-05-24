require('dotenv').config();
const jwt = require("jsonwebtoken");
const PRODUCTION = Boolean(process.env.PRODUCTION);
const emailing = require("./emailing/emailing")

function generateAccesstoken(id){
    return jwt.sign({id}, process.env.JWT_ACCESS_SECRETE, {expiresIn: process.env.JWT_ACCESS_DURATION})
}

function generateRefreshtoken(id){
    return jwt.sign({id}, process.env.JWT_REFRESH_SECRETE, {expiresIn: process.env.JWT_REFRESH_DURATION})
}

module.exports = async(user, res)=>{
    const URL =  `${process.env.FRONTEND_BASE_URL}/${process.env.FRONTEND_VERIFY_URL}/?token=${user.token}`
    
    if(PRODUCTION){
        const text = `
        <div>
            <h1
                style="text-align:center; color: #c20 padding: 10px">
                Welcome!
            </h1>

            <div>
                <div style="font-size: 1rem; text-align: center; padding: 10px">
                    Thanks for registering with us.
                </div>
                <a href="${URL}">Click to Verify Your Account</a>
            </div>

            <div>${URL}</div>
        </div>
        `
        const options = {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
            name: process.env.COMPANY_NAME,
            
            sender: process.env.EMAIL_USER,
            receiver: user.email,
            subject: 'Verify Your Account',
            html: text,
            feedback: 'Email sent successfully'
        }
        
        emailing.sendMails(options, async(err, resp)=>{
            if(err){
                if(err.message.includes("ENOTFOUND")){
                    return res.status(408).json({status: false, msg: "No network connectivity"})
                }
                if(err.message.includes("ETIMEDOUT")){
                    return res.status(408).json({status: false, msg: "Request Time-out! Check your network connections"})
                }
                else{
                    return res.status(400).json({status: false, msg: err.message})
                }
            }
            else{
                await user.save()

                res.status(201).cookie("access", generateAccesstoken(user._id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});

                res.status(201).cookie("refresh", generateRefreshtoken(user._id), {httOnly: true, maxAge:  Number(process.env.COOKIE_REFRESH_DURATION)});
        
                return res.status(200).json({status: true, msg: "Check your email to verify your account", isVerified: user.isVerified});
            }
        })                    

    }else{
        await user.save();

        res.status(201).cookie("access", generateAccesstoken(user._id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});

        res.status(201).cookie("refresh", generateRefreshtoken(user._id), {httOnly: true, maxAge:  Number(process.env.COOKIE_REFRESH_DURATION)});

        return res.status(200).json({status: true, msg: "On development mode! Please check below to verify your account", token: user.token, isVerified: user.isVerified});
    }
}
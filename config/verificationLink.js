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
        <div style="border: 2px solid #666; padding: 10px">
            <h3
                style="text-align:center; color: #c20; padding: 10px; background: teal">
                Welcome!
            </h3>

            <div>
                <div style="font-size: 1rem; text-align: center; padding: 10px">
                    Thanks for registering with us.
                </div>

                <div style="display: flex; justify-content: center">
                    <a style="display:inline-block; padding: 8px; background: teal; color: #fff; font-weight: 600" href="${URL}">Click to Verify Your Account</a>
                </div>
            </div>

            <div style="text-align: center; margin: 5px 0">${URL}</div>
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

                res.status(201).cookie("access", generateAccesstoken(user._id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});

                res.status(201).cookie("refresh", generateRefreshtoken(user._id), {httOnly: true, maxAge:  Number(process.env.COOKIE_REFRESH_DURATION)});
        
                return res.status(200).json({status: true, msg: `Check your email (${user.email}) to verify your account`, isVerified: user.isVerified});
            }
        })                    

    }else{

        res.status(201).cookie("access", generateAccesstoken(user._id), {httOnly: true, maxAge: Number(process.env.COOKIE_ACCESS_DURATION)});

        res.status(201).cookie("refresh", generateRefreshtoken(user._id), {httOnly: true, maxAge:  Number(process.env.COOKIE_REFRESH_DURATION)});

        return res.status(200).json({status: true, msg: "On development mode! Please check below to verify your account", token: user.token, isVerified: user.isVerified});
    }
}
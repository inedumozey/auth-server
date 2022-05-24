require('dotenv').config();
const PRODUCTION = Boolean(process.env.PRODUCTION);
const emailing = require("./emailing/emailing")

module.exports = async(data, res)=>{
    const {email, passwordReset} = data;
    
    const URL =  `${process.env.FRONTEND_BASE_URL}/${process.env.FRONTEND_VERIFY_URL}/?token=${passwordReset.token}`
    
    if(PRODUCTION){
        const text = `
        <div style="border: 2px solid #666; padding: 10px">

            <div>
                <h3 style="font-size: 1rem; text-align: center; padding: 10px">
                    Password Your Reset.
                </h3>

                <div style="width: 100%; display: flex; justify-content: center">
                    <a style="display:inline-block; padding: 8px; background: teal; color: #fff; font-weight: 600" href="${URL}">Click to Reset your Password</a>
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
            receiver: email,
            subject: 'Rest Your Password',
            html: text,
            feedback: 'Email sent successfully'
        }
        
        emailing.sendMails(options, async(err, resp)=>{
            if(err){
                if(err.message.includes("ENOTFOUND") || err.message.includes("EREFUSED") || err.message.includes("EHOSTUNREACH")){
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
                return res.status(200).json({status: true, msg: `Check your email (${email}) to reset your password`});
            }
        })                    

    }else{

        return res.status(200).json({status: true, msg: "On development mode! Please check below to reset your password", URL});
    }
}
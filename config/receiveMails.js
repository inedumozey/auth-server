const nodemailer = require('nodemailer');
const mailgun = require('nodemailer-mailgun-transport');

function receiveMails(options, cb){
    const transporter = nodemailer.createTransport(mailgun({
        auth: {
            api_key: process.env.API_KEY,
            domain: process.env.DOMAIN,
        }
    }));

    const mailOptions = {
        from: options.from,
        to: process.env.GMAIL_USER,
        subject: options.subject,
        text: options.text
    };

    transporter.sendMail(mailOptions, (error, response)=>{
        if(error){
            cb(error, null);
        }else{
            cb(null, options.msg);
        }
    })
}


module.exports = receiveMails;
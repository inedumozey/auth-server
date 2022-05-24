const mongoose = require('mongoose')
const User = mongoose.model('User');
const UNVERIFIED_USER_EXPIRED_IN = Number(process.env.UNVERIFIED_USER_EXPIRED_IN)
module.exports = {
    removeUnVerifiedUsers: async()=>{
        const users = await User.find()
        const expiresIn = UNVERIFIED_USER_EXPIRED_IN;
        const currentTime = new Date().getTime()

        for(let user of users){
            const createdTime = new Date(user.createdAt).getTime();

            if(!user.isVerified && currentTime - createdTime >= expiresIn){
                const users = await User.deleteMany({isVerified: false})
            }
        }
    }
}
const mongoose = require('mongoose')
const User = mongoose.model('User');

module.exports = {
    removeUnVerifiedUsers: async()=>{
        const users = await User.find()
        const expiresIn = 1000 * 60 * 5;
        const currentTime = new Date().getTime()

        for(let user of users){
            const createdTime = new Date(user.createdAt).getTime();

            if(!user.isVerified && currentTime - createdTime >= expiresIn){
                const users = await User.deleteMany({isVerified: false})
            }
        }
    }
}
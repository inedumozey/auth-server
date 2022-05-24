const mongoose = require('mongoose');
const PASS_RESET_TOKEN_EXPIRED_IN = Number(process.env.PASS_RESET_TOKEN_EXPIRED_IN)

const authSchema = new mongoose.Schema(
    {
        token: {
            type: String
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            expires: '3s', //will be removed after this time
            default: Date.now()
        }
    }
)

mongoose.model("PasswordReset", authSchema);
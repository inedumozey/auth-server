const mongoose = require('mongoose');
const authSchema = new mongoose.Schema(
    {
        passwordResetToken: {
            type: String,
            require: true
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)

mongoose.model("PasswordRest", authSchema);
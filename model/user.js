const mongoose = require('mongoose');
const schema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true
        },
        email: {
            type: String,
            trim: true,
            unique: true
        },
        password: {
            type: String,
            require: true,
            trim: true
        },
        userId: {
            type: String,
            unique: true
        },
        oauth: {
            type: Boolean,
            default: false
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        token: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        time: {
            type: Number,
            default: Date.now()
        }
    },
    {
        timestamps: true
    }
)

mongoose.model("User", schema);
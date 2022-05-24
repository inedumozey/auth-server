const mongoose = require('mongoose');
const schema = new mongoose.Schema(
    {
        isSubscribed: {
            type: Boolean,
            default: false
        },
        subId: {
            type: String,
        },
        
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)

mongoose.model("subscription", schema);
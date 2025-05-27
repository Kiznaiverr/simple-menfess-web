const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    recipient: String,
    recipientName: String,
    message: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    reports: [{
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    isReported: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Message', messageSchema);

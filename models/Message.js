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
    }
});

module.exports = mongoose.model('Message', messageSchema);

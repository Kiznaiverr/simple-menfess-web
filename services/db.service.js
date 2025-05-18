const mongoose = require('mongoose');
const Message = require('../models/Message');

class DatabaseService {
    constructor() {
        this.dbType = 'MongoDB';
    }

    async connect() {
        try {
            if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
                throw new Error('Invalid or missing MongoDB URI');
            }
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            throw error; // No fallback, just throw the error
        }
    }

    async getAllMessages() {
        return await Message.find().sort({ timestamp: -1 }).lean();
    }

    async createMessage(messageData) {
        const message = new Message(messageData);
        return await message.save();
    }

    async deleteMessage(messageId) {
        return await Message.findByIdAndDelete(messageId);
    }

    async deleteMessages(messageIds) {
        return await Message.deleteMany({ _id: { $in: messageIds } });
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new DatabaseService();

const mongoose = require('mongoose');
const Message = require('../models/Message');

class DatabaseService {
    constructor() {
        this._isConnected = false;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async connect() {
        if (!process.env.MONGODB_URI) {
            throw new Error('MongoDB URI is not defined');
        }

        try {
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4,
                // Removed deprecated options: useNewUrlParser and useUnifiedTopology
            };

            await mongoose.connect(process.env.MONGODB_URI, options);
            this._isConnected = true;
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            this._isConnected = false;
            throw error;
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

    async reportMessage(messageId, reason) {
        return await Message.findByIdAndUpdate(messageId, {
            $push: { reports: { reason } },
            isReported: true
        }, { new: true });
    }

    async getReportedMessages() {
        return await Message.find({ isReported: true }).sort({ timestamp: -1 }).lean();
    }

    async dismissReport(messageId) {
        return await Message.findByIdAndUpdate(messageId, {
            isReported: false
        }, { new: true });
    }

    isConnected() {
        return this._isConnected && mongoose.connection.readyState === 1;
    }
}

// Add connection event listeners
mongoose.connection.on('disconnected', () => {
    console.log('❌ MongoDB disconnected');
    DatabaseService._isConnected = false;
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB reconnected');
    DatabaseService._isConnected = true;
});

module.exports = new DatabaseService();

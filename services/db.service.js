const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const Message = require('../models/Message');

class DatabaseService {
    constructor() {
        this.useMongoDB = process.env.USE_MONGODB === 'true';
        this.localDbPath = path.join(__dirname, '../data/database.json');
    }

    async connect() {
        if (this.useMongoDB) {
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                console.log('Connected to MongoDB');
            } catch (error) {
                console.error('MongoDB connection error:', error);
                throw error;
            }
        } else {
            try {
                await fs.ensureFile(this.localDbPath);
                const exists = await fs.pathExists(this.localDbPath);
                if (!exists || (await fs.readFile(this.localDbPath, 'utf8')).trim() === '') {
                    await fs.writeJson(this.localDbPath, { messages: [] });
                }
                console.log('Using local JSON database');
            } catch (error) {
                console.error('Local database error:', error);
                throw error;
            }
        }
    }

    async getAllMessages() {
        if (this.useMongoDB) {
            return await Message.find().sort({ timestamp: -1 }).lean();
        } else {
            const data = await fs.readJson(this.localDbPath);
            return data.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }

    async createMessage(messageData) {
        if (this.useMongoDB) {
            const message = new Message(messageData);
            return await message.save();
        } else {
            const data = await fs.readJson(this.localDbPath);
            const newMessage = {
                _id: Date.now().toString(),
                ...messageData,
                timestamp: new Date(),
            };
            data.messages.push(newMessage);
            // Save with pretty formatting - indent with 4 spaces
            await fs.writeJson(this.localDbPath, data, { spaces: 4 });
            return newMessage;
        }
    }

    async deleteMessage(messageId) {
        if (this.useMongoDB) {
            return await Message.findByIdAndDelete(messageId);
        } else {
            const data = await fs.readJson(this.localDbPath);
            data.messages = data.messages.filter(msg => msg._id !== messageId);
            await fs.writeJson(this.localDbPath, data);
        }
    }

    async deleteMessages(messageIds) {
        if (this.useMongoDB) {
            return await Message.deleteMany({ _id: { $in: messageIds } });
        } else {
            const data = await fs.readJson(this.localDbPath);
            data.messages = data.messages.filter(msg => !messageIds.includes(msg._id));
            await fs.writeJson(this.localDbPath, data);
        }
    }
}

module.exports = new DatabaseService();

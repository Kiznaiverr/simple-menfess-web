const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();

// Environment Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const MONGODB_URI = process.env.MONGODB_URI.replace('<db_password>', process.env.DB_PASSWORD);
const BASE_URL = isDevelopment ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: isDevelopment ? 'http://localhost:3000' : process.env.VERCEL_URL,
    credentials: true
}));
app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/data', express.static(path.join(__dirname, 'public/data')));

// View Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/explore.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin/dashboard.html'));
});

// API Endpoints
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .lean(); // Convert to plain JavaScript objects
        res.json({ 
            messages: messages.map(msg => ({
                ...msg,
                id: msg._id // Map MongoDB _id to id for frontend compatibility
            }))
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Error fetching messages', messages: [] });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const newMessage = new Message({
            recipient: recipient.toLowerCase(),
            recipientName: recipient,
            message,
            timestamp: new Date(),
            isPublic: true
        });
        await newMessage.save();
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

app.delete('/api/messages', async (req, res) => {
    try {
        const { ids } = req.body;
        await Message.deleteMany({ _id: { $in: ids } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting messages' });
    }
});

app.get('/api/verify-admin', (req, res) => {
    const { password } = req.query;
    res.json({ valid: password === process.env.ADMIN_PASSWORD });
});

// Add system info endpoint
app.get('/api/system-info', (req, res) => {
    try {
        const systemInfo = {
            lastUpdate: new Date().toISOString(),
            dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            serverLoad: {
                value: Math.floor(Math.random() * 30), // Simulated load 0-30%
                color: 'green'
            }
        };

        // Adjust color based on load
        if (systemInfo.serverLoad.value > 20) {
            systemInfo.serverLoad.color = 'yellow';
        } else if (systemInfo.serverLoad.value > 10) {
            systemInfo.serverLoad.color = 'blue';
        }

        res.json(systemInfo);
    } catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({ error: 'Error fetching system info' });
    }
});

// Serve offline page
app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/errors/offline.html'));
});

// 404 handler - must be last route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
});

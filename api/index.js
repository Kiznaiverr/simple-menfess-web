const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGODB_URI.replace('<db_password>', process.env.DB_PASSWORD), {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../views')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/explore.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

// API endpoints
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).lean();
        res.json({ messages: messages.map(msg => ({ ...msg, id: msg._id })) });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages', messages: [] });
    }
});

// ... other API endpoints ...

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../views/errors/404.html'));
});

module.exports = app;

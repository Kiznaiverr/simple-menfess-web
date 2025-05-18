const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./services/db.service');
require('dotenv').config();

const app = express();

// Environment Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
console.log(`Server running on ${BASE_URL}`);

// Initialize database connection
db.connect()
    .catch(err => {
        console.error('❌ Database initialization error:', err);
        // Don't exit process, continue running to show maintenance page
    });

// Middleware
app.use(cors({
    origin: isDevelopment ? 'http://localhost:3000' : process.env.VERCEL_URL,
    credentials: true
}));
app.use(express.json());

// Add maintenance middleware - place this before other routes
app.use((req, res, next) => {
    // Only check maintenance mode, remove db connection check
    if (process.env.MAINTENANCE_MODE === 'true' && !req.path.includes('/assets/')) {
        return res.sendFile(path.join(__dirname, 'views/errors/maintenance.html'));
    }
    next();
});

// API error handling middleware
app.use('/api/*', (req, res, next) => {
    if (!db.isConnected()) {
        return res.status(503).json({ 
            error: 'Service temporarily unavailable',
            status: 'error'
        });
    }
    next();
});

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

// Legal Routes
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/legal/privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/legal/terms.html'));
});

// API Endpoints
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await db.getAllMessages();
        res.json({ messages });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Error fetching messages', messages: [] });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const newMessage = await db.createMessage({
            recipient: recipient.toLowerCase(),
            recipientName: recipient,
            message,
            isPublic: true
        });
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        await db.deleteMessage(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

app.delete('/api/messages', async (req, res) => {
    try {
        const { ids } = req.body;
        await db.deleteMessages(ids);
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
            dbStatus: db.isConnected() ? 'connected' : 'disconnected',
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

const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./services/db.service');
const os = require('os');
const osUtils = require('os-utils');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Environment Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
console.log(`Server running on ${BASE_URL}`);

// Initialize database connection
db.connect()
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch(err => {
        console.error('❌ Database connection error:', err);
    });

// Middleware
app.use(cors({
    origin: '*', // Allow all origins in production
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
app.use('/api/*', async (req, res, next) => {
    try {
        if (!db.isConnected()) {
            // Try to reconnect
            await db.connect();
        }
        next();
    } catch (error) {
        return res.status(503).json({ 
            error: 'Database connection error',
            status: 'error',
            message: 'Please try again later'
        });
    }
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

// Update the delete endpoint to also reload reported messages
app.delete('/api/messages/:id', async (req, res) => {
    try {
        await db.deleteMessage(req.params.id);
        const messages = await db.getAllMessages(); // Get updated messages
        const reportedMessages = await db.getReportedMessages(); // Get updated reported messages
        res.json({ 
            success: true,
            messages,
            reportedMessages 
        });
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

app.post('/api/verify-admin', (req, res) => {
    try {
        const { password } = req.body;
        const isValid = require('crypto').timingSafeEqual(
            Buffer.from(password || ''),
            Buffer.from(process.env.ADMIN_PASSWORD)
        );
        
        res.json({ valid: isValid });
    } catch {
        res.status(401).json({ valid: false });
    }
});

// Add CPU monitoring
let startTime = Date.now();
let startUsage = process.cpuUsage();

function getCPUUsage() {
    const now = Date.now();
    const end = process.cpuUsage(startUsage);
    const diff = now - startTime;

    const percentage = 100 * (end.user + end.system) / (diff * 1000);
    
    startTime = now;
    startUsage = process.cpuUsage();
    
    return Math.min(100, Math.round(percentage));
}

const MONGODB_FREE_TIER_LIMIT = 512; // 512MB limit for free tier

app.get('/api/system-info', async (req, res) => {
    try {
        const cpuUsage = getCPUUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        // Get MongoDB stats
        const dbStats = await mongoose.connection.db.stats();
        
        // Convert bytes to appropriate units (KB, MB, GB)
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }

        const dataSize = dbStats.dataSize + dbStats.indexSize;
        const maxSize = MONGODB_FREE_TIER_LIMIT * 1024 * 1024; // Convert MB to bytes
        
        const systemInfo = {
            lastUpdate: new Date().toISOString(),
            dbStatus: db.isConnected() ? 'connected' : 'disconnected',
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0].model,
                speed: os.cpus()[0].speed,
                usage: cpuUsage,
                load: os.loadavg()[0].toFixed(2)
            },
            memory: {
                total: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
                free: (freeMem / (1024 * 1024 * 1024)).toFixed(2),
                used: ((totalMem - freeMem) / (1024 * 1024 * 1024)).toFixed(2),
                usagePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(1)
            },
            database: {
                size: formatBytes(dataSize),
                storage: formatBytes(maxSize),
                collections: dbStats.collections,
                indexes: dbStats.indexes,
                objects: dbStats.objects,
                freeSpace: ((maxSize - dataSize) / maxSize * 100).toFixed(1),
                maxSize: `${MONGODB_FREE_TIER_LIMIT} MB`,
                usagePercent: ((dataSize / maxSize) * 100).toFixed(1)
            }
        };

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

// API Endpoints - Reported Messages
app.post('/api/messages/:id/report', async (req, res) => {
    try {
        const { reason } = req.body;
        const reportedMessage = await db.reportMessage(req.params.id, reason);
        res.json(reportedMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error reporting message' });
    }
});

app.get('/api/messages/reported', async (req, res) => {
    try {
        const messages = await db.getReportedMessages();
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reported messages' });
    }
});

app.post('/api/messages/:id/dismiss-report', async (req, res) => {
    try {
        const message = await db.dismissReport(req.params.id);
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Error dismissing report' });
    }
});

// 404 handler - must be last route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
});

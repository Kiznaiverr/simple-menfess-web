/* 
 * Main Server Configuration File
 * Sets up Express server, routes, middleware and API endpoints
 */

// Dependencies
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./services/db.service');
const os = require('os');
const osUtils = require('os-utils');
const mongoose = require('mongoose');
const rateLimit = require('./services/rateLimit.service');
require('dotenv').config();

const app = express();

// Environment Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);

// Database Connection
db.connect()
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch(err => {
        console.error('❌ Database connection error:', err);
    });

// Middleware Configuration
app.use(cors({
    origin: '*', // Allow all origins in production
    credentials: true
}));
app.use(express.json());

// Maintenance mode middleware
app.use((req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true' && !req.path.includes('/assets/')) {
        return res.sendFile(path.join(__dirname, 'views/errors/maintenance.html'));
    }
    next();
});

// API error handling middleware
app.use('/api/*', async (req, res, next) => {
    try {
        if (!db.isConnected()) {
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

// Add after existing middleware and before routes
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    next();
});

// Update static file serving with absolute paths
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
app.use('/data', express.static(path.join(process.cwd(), 'public', 'data')));

// View Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
    } catch (error) {
        console.error('Error serving index:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/explore.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin/login.html'));
});

app.get('/dashboard', (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), 'views', 'admin', 'dashboard.html'));
    } catch (error) {
        console.error('Error serving dashboard:', error);
        res.status(500).send('Server Error');
    }
});

// Legal pages
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/legal/privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/legal/terms.html'));
});

// API Endpoints - Messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await db.getAllMessages();
        res.json({ messages });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Error fetching messages', messages: [] });
    }
});

const badwordsData = require('./data/badwords.json');

// Add before API endpoints
function containsBadwords(text) {
    // Convert to lowercase and remove extra spaces
    const normalized = text.toLowerCase()
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/[^\w\s]/g, ''); // Remove special characters

    // Check exact matches first
    const words = text.toLowerCase().split(/\s+/);
    const exactMatch = words.find(word => 
        badwordsData.badwords.includes(word) && 
        !badwordsData.exceptions.includes(word)
    );
    
    if (exactMatch) return exactMatch;

    // Check for spaced/obfuscated bad words
    return badwordsData.badwords.find(badword => {
        // Remove spaces and special chars from bad word too
        const normalizedBadword = badword.replace(/\s+/g, '');
        return normalized.includes(normalizedBadword) && 
               !badwordsData.exceptions.includes(badword);
    }) || false;
}

// Add rate limit cleanup every hour
setInterval(() => rateLimit.cleanup(), 60 * 60 * 1000);

// Update POST /api/messages endpoint
app.post('/api/messages', async (req, res) => {
    try {
        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Check rate limit
        const rateLimitCheck = rateLimit.checkRateLimit(ip);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({ 
                error: rateLimitCheck.error
            });
        }

        const { recipient, message } = req.body;

        // Check for badwords in message
        const badWordInMessage = containsBadwords(message);
        if (badWordInMessage) {
            return res.status(400).json({ 
                error: `Pesan mengandung kata tidak pantas "${badWordInMessage}"`
            });
        }

        // Check for badwords in recipient name
        const badWordInRecipient = containsBadwords(recipient);
        if (badWordInRecipient) {
            return res.status(400).json({
                error: `Nama penerima mengandung kata tidak pantas "${badWordInRecipient}"`
            });
        }

        const newMessage = await db.createMessage({
            recipient: recipient.toLowerCase(),
            recipientName: recipient,
            message,
            isPublic: true,
            ip: ip // Optional: store IP for tracking
        });
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

// Delete single message and return updated lists
app.delete('/api/messages/:id', async (req, res) => {
    try {
        await db.deleteMessage(req.params.id);
        const messages = await db.getAllMessages();
        const reportedMessages = await db.getReportedMessages();
        res.json({ 
            success: true,
            messages,
            reportedMessages 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

// Bulk delete messages
app.delete('/api/messages', async (req, res) => {
    try {
        const { ids } = req.body;
        await db.deleteMessages(ids);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting messages' });
    }
});

// API Endpoints - Admin
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

// System Monitoring
// CPU usage tracking variables
let startTime = Date.now();
let startUsage = process.cpuUsage();

/**
 * Calculates current CPU usage percentage
 * @returns {number} CPU usage percentage (0-100)
 */
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

// System information endpoint
app.get('/api/system-info', async (req, res) => {
    try {
        const cpuUsage = getCPUUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        // Get MongoDB stats
        const dbStats = await mongoose.connection.db.stats();
        
        // Helper function to format byte sizes
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }

        const dataSize = dbStats.dataSize + dbStats.indexSize;
        const maxSize = MONGODB_FREE_TIER_LIMIT * 1024 * 1024; 
        
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

// Offline Page
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

// Add banned page route
app.get('/banned', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/errors/banned.html'));
});

// Add check-ban endpoint
app.get('/api/check-ban', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const banInfo = rateLimit.getBanInfo(ip);
    res.json(banInfo);
});

// Error Page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: isDevelopment ? err.message : 'Internal Server Error'
    });
});

// Server Startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
});

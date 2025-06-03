// Main Server Configuration File

const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./services/db.service');
const os = require('os');
const mongoose = require('mongoose');
const rateLimit = require('./services/rateLimit.service');
const jwt = require('jsonwebtoken');
const badwords = require('indonesian-badwords');
const discordService = require('./services/discord.service');
require('dotenv').config();

const app = express();

// Environment & Database
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;
console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);

db.connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection error:', err));

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true' && !req.path.includes('/assets/')) {
        return res.sendFile(path.join(__dirname, 'views/errors/maintenance.html'));
    }
    next();
});

app.use('/api/*', async (req, res, next) => {
    try {
        if (!db.isConnected()) await db.connect();
        next();
    } catch (error) {
        return res.status(503).json({ 
            error: 'Database connection error',
            status: 'error',
            message: 'Please try again later'
        });
    }
});

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    next();
});

app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
app.use('/data', express.static(path.join(process.cwd(), 'public', 'data')));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

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

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/support.html'));
});

// Dashboard
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(process.cwd(), 'views', 'admin', 'dashboard.html');
    res.sendFile(dashboardPath);
});

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

setInterval(() => rateLimit.cleanup(), 60 * 60 * 1000);

// POST/DELETE with API key
app.post('/api/messages', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const rateLimitCheck = rateLimit.checkRateLimit(ip);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({ error: rateLimitCheck.error });
        }
        const { recipient, message } = req.body;

        // Check for bad words in message and recipient
        if (badwords.flag(message)) {
            const badWordsList = badwords.badwords(message);
            return res.status(400).json({ 
                error: `Pesan mengandung kata tidak pantas: ${badWordsList.join(', ')}` 
            });
        }

        if (badwords.flag(recipient)) {
            const badWordsList = badwords.badwords(recipient);
            return res.status(400).json({ 
                error: `Nama penerima mengandung kata tidak pantas: ${badWordsList.join(', ')}` 
            });
        }

        const newMessage = await db.createMessage({
            recipient: recipient.toLowerCase(),
            recipientName: recipient,
            message,
            isPublic: true,
            ip: ip
        });
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    try {
        await db.deleteMessage(req.params.id);
        const messages = await db.getAllMessages();
        const reportedMessages = await db.getReportedMessages();
        res.json({ success: true, messages, reportedMessages });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

app.delete('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;
        await db.deleteMessages(ids);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting messages' });
    }
});

// Admin & System
app.post('/api/verify-admin', (req, res) => {
    try {
        const { password } = req.body;
        const isValid = require('crypto').timingSafeEqual(
            Buffer.from(password || ''),
            Buffer.from(process.env.ADMIN_PASSWORD)
        );
        
        if (isValid) {
            const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ valid: true, token });
        } else {
            res.json({ valid: false });
        }
    } catch {
        res.status(401).json({ valid: false });
    }
});

// System Monitoring
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
const MONGODB_FREE_TIER_LIMIT = 512;

app.get('/api/system-info', async (req, res) => {
    try {
        const cpuUsage = getCPUUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const dbStats = await mongoose.connection.db.stats();
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

// Other Features
app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/errors/offline.html'));
});

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

app.get('/banned', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/errors/banned.html'));
});

app.get('/api/check-ban', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const banInfo = rateLimit.getBanInfo(ip);
    res.json(banInfo);
});

// Support Endpoint
app.post('/api/support', async (req, res) => {
    try {
        const { type, description, contact } = req.body;
        
        if (!type || !description) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: {
                    type: !type ? 'Type is required' : null,
                    description: !description ? 'Description is required' : null
                }
            });
        }

        console.log('Processing support request:', { type, description, contact });

        const sent = await discordService.sendSupportNotification({
            type,
            description,
            contact: contact || 'Not provided'
        });

        if (!sent) {
            console.error('Failed to send Discord notification');
            throw new Error('Failed to send notification to support team');
        }

        res.json({ 
            success: true,
            message: 'Support request sent successfully'
        });
    } catch (error) {
        console.error('Support submission error:', error);
        res.status(500).json({ 
            error: 'Failed to submit support request',
            message: error.message
        });
    }
});

// Error Handling
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: isDevelopment ? err.message : 'Internal Server Error'
    });
});

// Input Validation
const validateInput = (req, res, next) => {
    const { recipient, message } = req.body;
    const suspicious = /<[^>]*script|javascript:|data:|vbscript:|file:|about:|blob:/i;
    if (suspicious.test(recipient) || suspicious.test(message)) {
        return res.status(400).json({ error: 'Invalid input detected' });
    }
    if (message && message.length > 500) {
        return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }
    if (recipient && recipient.length > 50) {
        return res.status(400).json({ error: 'Recipient name too long (max 50 characters)' });
    }
    next();
};

// Server Startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
});

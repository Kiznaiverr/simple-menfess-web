const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
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
        const data = await fs.readFile(path.join(__dirname, 'public/data/messages.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const data = await fs.readFile(path.join(__dirname, 'public/data/messages.json'), 'utf8');
        const messages = JSON.parse(data);
        
        const newMessage = {
            id: messages.messages.length + 1,
            recipient: recipient.toLowerCase().replace(/\s+/g, '-'),
            recipientName: recipient,
            message: message,
            timestamp: new Date().toISOString(),
            isPublic: true
        };
        
        messages.messages.push(newMessage);
        
        await fs.writeFile(
            path.join(__dirname, 'public/data/messages.json'),
            JSON.stringify(messages, null, 2)
        );
        
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public/data/messages.json'), 'utf8');
        const json = JSON.parse(data);
        const id = parseInt(req.params.id);

        json.messages = json.messages.filter(msg => msg.id !== id);
        
        await fs.writeFile(path.join(__dirname, 'public/data/messages.json'), JSON.stringify(json, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

app.delete('/api/messages', async (req, res) => {
    try {
        const { ids } = req.body;
        const data = await fs.readFile(path.join(__dirname, 'public/data/messages.json'), 'utf8');
        const json = JSON.parse(data);

        json.messages = json.messages.filter(msg => !ids.includes(msg.id));
        
        await fs.writeFile(path.join(__dirname, 'public/data/messages.json'), JSON.stringify(json, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting messages' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

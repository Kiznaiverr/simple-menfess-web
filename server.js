const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const { Server } = require('ws');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new Server({ server });

// WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Broadcast to all clients
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'messages.json'), 'utf8');
        const messages = JSON.parse(data);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error reading messages' });
    }
});

// Add new message
app.post('/api/messages', async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const data = await fs.readFile(path.join(__dirname, 'data', 'messages.json'), 'utf8');
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
            path.join(__dirname, 'data', 'messages.json'),
            JSON.stringify(messages, null, 2)
        );
        
        // Broadcast new message to all clients
        broadcast({ type: 'new_message', message: newMessage });
        
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

// Delete single message
app.delete('/api/messages/:id', async (req, res) => {
    try {
        const data = await fs.readFile('./data/messages.json', 'utf8');
        const json = JSON.parse(data);
        const id = parseInt(req.params.id);

        json.messages = json.messages.filter(msg => msg.id !== id);
        
        await fs.writeFile('./data/messages.json', JSON.stringify(json, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

// Delete multiple messages
app.delete('/api/messages', async (req, res) => {
    try {
        const { ids } = req.body;
        const data = await fs.readFile('./data/messages.json', 'utf8');
        const json = JSON.parse(data);

        json.messages = json.messages.filter(msg => !ids.includes(msg.id));
        
        await fs.writeFile('./data/messages.json', JSON.stringify(json, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting messages' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

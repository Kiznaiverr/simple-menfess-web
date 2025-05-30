// run in the terminal with `node scripts/clean-badwords.js`
// this script will connect to the MongoDB database, clean messages by removing XSS vectors, and ensure reports are valid.


const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 
const mongoose = require('mongoose');
const Message = require('../models/Message');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

async function cleanDatabase() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        console.log('Fixing invalid reports...');
        await mongoose.connection.db.collection('messages').updateMany(
            { reports: { $type: "number" } },
            { $set: { reports: [], isReported: false } }
        );

        const messages = await Message.find({});
        console.log(`Found ${messages.length} messages to clean`);

        let cleaned = 0;
        let errors = 0;

        for (const message of messages) {
            try {
                const cleanText = (text) => {
                    if (!text) return '';

                    // First pass: Basic HTML/script removal
                    let cleaned = DOMPurify.sanitize(text, {
                        ALLOWED_TAGS: [],
                        ALLOWED_ATTR: [],
                        ALLOW_DATA_ATTR: false,
                        ALLOW_UNKNOWN_PROTOCOLS: false,
                        SANITIZE_DOM: true,
                        USE_PROFILES: { html: false }
                    });

                    // Second pass: Remove all potential XSS vectors
                    cleaned = cleaned
                        .replace(/<[^>]*>/g, '')
                        .replace(/javascript:/gi, '')
                        .replace(/data:/gi, '')
                        .replace(/vbscript:/gi, '')
                        .replace(/on\w+=/gi, '')
                        .replace(/style=/gi, '')
                        .replace(/@(?:keyframes|import|charset|namespace|media|supports|document|page|font-face|counter-style)/gi, '')
                        .replace(/(?:\\[ux]|%u|%x)[0-9a-f]{2,6}/gi, '')
                        .replace(/&#x?[0-9a-f]+;?/gi, '')
                        .replace(/-moz-binding|\bexpression\b|\bxml\b/gi, '')
                        .replace(/behavior:|@import|@charset/gi, '')
                        .replace(/animation(?:-\w+)?:/gi, '')
                        .replace(/\(\s*[^)]*\s*\)/g, '')  
                        .replace(/[^\w\s.,!?-]/g, '');    

                    return cleaned.trim();
                };

                message.message = cleanText(message.message);
                message.recipientName = cleanText(message.recipientName);
                message.recipient = cleanText(message.recipient).toLowerCase();

                if (!Array.isArray(message.reports)) {
                    message.reports = [];
                    message.isReported = false;
                }

                await message.save();
                console.log(`✅ Cleaned message ${message._id}`);
                cleaned++;
            } catch (err) {
                console.error(`❌ Error cleaning message ${message._id}:`, err.message);
                errors++;
            }
        }

        console.log('\nCleaning Summary:');
        console.log(`Total messages: ${messages.length}`);
        console.log(`Successfully cleaned: ${cleaned}`);
        console.log(`Errors: ${errors}`);
        console.log('\nDatabase cleaning completed');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error.message);
        try {
            await mongoose.connection.close();
        } catch {}
        process.exit(1);
    }
}

cleanDatabase();

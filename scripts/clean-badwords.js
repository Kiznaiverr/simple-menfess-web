// run in the terminal with `node scripts/clean-badwords.js`
// this will connect to the MongoDB database, check all messages for bad words, clean them if necessary, and delete any messages that contain bad words in either the recipient name or message content.



require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Message = require('../models/Message');
const badwordsData = require('../data/badwords.json');

async function cleanBadWords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const messages = await Message.find({});
        console.log(`Found ${messages.length} messages to check`);

        let cleaned = 0;
        let deleted = 0;

        function containsBadWord(text) {
            if (!text) return false;

            const normalized = text.toLowerCase()
                .replace(/0/g, 'o')
                .replace(/1/g, 'i')
                .replace(/3/g, 'e')
                .replace(/4/g, 'a')
                .replace(/5/g, 's')
                .replace(/7/g, 't')
                .replace(/8/g, 'b')
                .replace(/(.)\1+/g, '$1')
                .replace(/[^\w\s]/g, '')
                .trim();

            for (const badword of badwordsData.badwords) {
                const normalizedBadword = badword.toLowerCase()
                    .replace(/[^\w]/g, '');
                if (normalized.includes(normalizedBadword)) {
                    return true;
                }
            }
            return false;
        }

        for (const message of messages) {
            // Check recipient
            const hasRecipientBadWord = containsBadWord(message.recipientName);
            const hasMessageBadWord = containsBadWord(message.message);

            if (hasRecipientBadWord || hasMessageBadWord) {
                try {
                    await Message.deleteOne({ _id: message._id });
                    console.log(`❌ Deleted message ${message._id} - Contains bad word`);
                    deleted++;
                } catch (err) {
                    console.error(`Error deleting message ${message._id}:`, err);
                }
                continue;
            }

            // Clean and update message
            message.recipientName = message.recipientName
                .replace(/[^\w\s.,!?-]/g, '')
                .trim();
            message.message = message.message
                .replace(/[^\w\s.,!?-]/g, '')
                .trim();
            message.recipient = message.recipientName.toLowerCase();

            try {
                await message.save();
                console.log(`✅ Cleaned message ${message._id}`);
                cleaned++;
            } catch (err) {
                console.error(`Error saving message ${message._id}:`, err);
            }
        }

        console.log('\nCleaning Summary:');
        console.log(`Total messages checked: ${messages.length}`);
        console.log(`Messages cleaned: ${cleaned}`);
        console.log(`Messages deleted: ${deleted}`);
        console.log('Database cleaning completed');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        try {
            await mongoose.connection.close();
        } catch {}
        process.exit(1);
    }
}

cleanBadWords();

// run in the terminal with `node scripts/clean-badwords.js`
// this will connect to the MongoDB database, check all messages for bad words, clean them if necessary, and delete any messages that contain bad words in either the recipient name or message content.



require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Message = require('../models/Message');
const badwords = require('indonesian-badwords');

async function cleanBadWords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        const messages = await Message.find({});
        console.log(`Found ${messages.length} messages to check`);

        let cleaned = 0;
        let deleted = 0;

        for (const message of messages) {
            if (
                !message.recipient ||
                !message.recipientName ||
                !message.message ||
                !message.recipient.trim() ||
                !message.recipientName.trim() ||
                !message.message.trim()
            ) {
                try {
                    await Message.deleteOne({ _id: message._id });
                    console.log(`❌ Deleted message ${message._id} - Empty field`);
                    deleted++;
                } catch (err) {
                    console.error(`Error deleting message ${message._id}:`, err);
                }
                continue;
            }

            const hasRecipientBadWord = badwords.flag(message.recipientName);
            const hasMessageBadWord = badwords.flag(message.message);

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

            // Clean and update message if needed
            const cleanedMessage = badwords.filter(message.message);
            const cleanedRecipient = badwords.filter(message.recipientName);

            if (cleanedMessage !== message.message || cleanedRecipient !== message.recipientName) {
                message.message = cleanedMessage;
                message.recipientName = cleanedRecipient;
                message.recipient = cleanedRecipient.toLowerCase();

                try {
                    await message.save();
                    console.log(`✅ Cleaned message ${message._id}`);
                    cleaned++;
                } catch (err) {
                    console.error(`Error saving message ${message._id}:`, err);
                }
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

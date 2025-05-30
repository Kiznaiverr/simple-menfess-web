const mongoose = require('mongoose');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const messageSchema = new mongoose.Schema({
    recipient: String,
    recipientName: String,
    message: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    reports: [{
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    isReported: {
        type: Boolean,
        default: false
    }
});

// Fitur: Sanitasi mendalam untuk pesan dan nama
function deepSanitize(text) {
    if (!text) return '';

    let cleaned = text.toLowerCase()
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

    cleaned = DOMPurify.sanitize(cleaned, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        ALLOW_SCRIPT_ATTRS: false,
        ALLOW_STYLE_TAGS: false,
        SANITIZE_DOM: true
    });

    return cleaned;
}

// Fitur: Validasi panjang pesan dan nama penerima
messageSchema.pre('validate', function(next) {
    if (this.message && this.message.length > 500) {
        next(new Error('Message too long (max 500 characters)'));
        return;
    }
    if (this.recipientName && this.recipientName.length > 50) {
        next(new Error('Recipient name too long (max 50 characters)'));
        return;
    }
    next();
});

// Fitur: Sanitasi sebelum simpan
messageSchema.pre('save', function(next) {
    try {
        if (this.isModified('message')) {
            const sanitized = deepSanitize(this.message);
            this.message = this.message.replace(/[^\w\s.,!?-]/g, '').trim();
        }
        if (this.isModified('recipientName')) {
            const sanitized = deepSanitize(this.recipientName);
            this.recipientName = this.recipientName.replace(/[^\w\s.,!?-]/g, '').trim();
        }
        if (this.isModified('recipient')) {
            const sanitized = deepSanitize(this.recipient);
            this.recipient = sanitized;
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Fitur: Sanitasi dokumen yang sudah ada
messageSchema.statics.sanitizeExisting = async function() {
    const messages = await this.find({});
    for (const message of messages) {
        message.message = deepSanitize(message.message);
        message.recipientName = deepSanitize(message.recipientName);
        message.recipient = deepSanitize(message.recipient).toLowerCase();
        await message.save();
    }
};

module.exports = mongoose.model('Message', messageSchema);

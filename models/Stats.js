const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    visitors: [String], // Array of IPs or session IDs
    popularPages: [{
        path: String,
        views: Number
    }],
    lastReset: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stats', statsSchema);

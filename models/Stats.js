const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: [{
        id: String,
        userAgent: String,
        firstVisit: Date,
        lastVisit: Date
    }],
    dailyVisitors: [{
        id: String,
        userAgent: String,
        date: Date
    }],
    popularPages: [{
        path: String,
        views: Number
    }]
});

statsSchema.methods.addVisitor = function(visitorId, userAgent) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update unique visitors
    if (!this.uniqueVisitors.find(v => v.id === visitorId)) {
        this.uniqueVisitors.push({
            id: visitorId,
            userAgent,
            firstVisit: new Date(),
            lastVisit: new Date()
        });
    }

    // Update daily visitors
    if (!this.dailyVisitors.find(v => v.id === visitorId && v.date.toDateString() === today.toDateString())) {
        this.dailyVisitors.push({
            id: visitorId,
            userAgent,
            date: today
        });
    }

    this.pageViews++;
    return this.save();
};

module.exports = mongoose.model('Stats', statsSchema);

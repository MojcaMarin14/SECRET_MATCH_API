const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        default: 'Secret Match'
    },
    pairingsAssigned: {
        type: Boolean,
        default: false
    },
    lastAssigned: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', eventSchema);
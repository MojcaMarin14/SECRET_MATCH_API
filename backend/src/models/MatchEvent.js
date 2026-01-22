const mongoose = require('mongoose');

const matchEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    default: 'Secret Match 2024',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pairingsAssigned: {
    type: Boolean,
    default: false
  },
  assignedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MatchEvent', matchEventSchema);
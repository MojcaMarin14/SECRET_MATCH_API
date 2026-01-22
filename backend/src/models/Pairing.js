const mongoose = require('mongoose');

const pairingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchEvent',
    required: true
  },
  giver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prepreči dvojna parjenja
pairingSchema.index({ event: 1, giver: 1 }, { unique: true });

module.exports = mongoose.model('Pairing', pairingSchema);
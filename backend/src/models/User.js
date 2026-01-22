const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hasJoinedEvent: {
    type: Boolean,
    default: false
  },
  preferences: {
    type: String,
    default: ''
  },
  personalMessage: {
    type: String,
    default: ''
  },
  // ===== DODAJ TO POLJE =====
  assignedMatch: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    preferences: String
  },
  // ===== KONEC DODAJANJA =====
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Metoda za preverjanje gesla
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
// server/models/User.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true, 
    unique: true,   
  },
  email: { 
    type: String, 
    required: true, 
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }]
}, {
  timestamps: true 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
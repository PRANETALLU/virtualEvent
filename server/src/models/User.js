const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true},
  bio: { type: String, default: "" },
  preferences: { type: [String], default: []},
  interests: { type: [String], default: [] },
  avatar: { type: String, default: "" } 
});

module.exports = mongoose.model('User', UserSchema);

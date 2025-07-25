const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  instaEmail: { type: String },
  instaPassword: { type: String },
  instagramToken: { type: String },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profilePicture: {
  type: String, // URL ou base64
  default: '',  // ou une URL d'image par défaut
  },
  

});

module.exports = mongoose.model('User', userSchema);

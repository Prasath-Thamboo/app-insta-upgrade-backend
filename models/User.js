const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  instagramToken: { type: String },
  instagramUserId: { type: String },


  // ✅ Mise à jour des rôles
  role: {
    type: String,
    enum: ['user', 'admin', 'freeuser', 'testeur'],
    default: 'freeuser',
  },

  // ✅ Gestion de l’essai gratuit

  trialStart: {
    type: Date,
  },
  
  trialEnds: {
    type: Date,
  },

  // ✅ Abonnement Stripe
  isSubscribed: {
    type: Boolean,
    default: false,
  },

  // ✅ Apparence personnalisée
  profilePicture: {
    type: String,
    default: '',
  },
  dashboardStyle: {
    type: String,
    default: 'classic',
  },

  // ✅ Vérification email
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
});

module.exports = mongoose.model('User', userSchema);

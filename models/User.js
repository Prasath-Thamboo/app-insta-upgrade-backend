// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ✅ Identité & Auth
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },

  // ✅ Instagram
  fbUserLongLivedToken: { type: String }, // token utilisateur Facebook (long-lived)
  instagramPageId: { type: String },      // Page FB liée à l’IG
  instagramToken: { type: String },       // ⚠️ ici on stocke le PAGE access token
  instagramUserId: { type: String }, 

  // ✅ Rôles
  role: {
    type: String,
    enum: ['user', 'admin', 'freeuser', 'testeur'],
    default: 'freeuser',
  },

  // ✅ Essai gratuit
  trialStart: { type: Date },
  trialEnds: { type: Date },
  hasUsedTrial: { type: Boolean, default: false },

  // ✅ Abonnement Stripe
  isSubscribed: { type: Boolean, default: false },
  stripeCustomerId: { type: String, index: true },      // 👈 relie les events Stripe
  stripeSubscriptionId: { type: String },               // 👈 id de souscription
  subscriptionStart: { type: Date },                    // 👈 date d’activation

  // ✅ Apparence
  profilePicture: { type: String, default: '' },        // URL Cloudinary (versionnée)
  profilePicturePublicId: { type: String, default: '' },// ex: "users/<userId>/avatar"
  dashboardStyle: { type: String, default: 'classic' },

  // ✅ Vérification email
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },

  // ✅ Reset password
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
}, {
  timestamps: true, // createdAt / updatedAt
});

module.exports = mongoose.model('User', userSchema);

// app.js - Application Express (configuration)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const stripeRoutes = require('./routes/stripe');
const stripeWebhookRoutes = require('./routes/stripeWebhook'); // ✅ Webhook unique
const instagramRoutes = require('./routes/instagram');
const trialRoutes = require('./routes/trial');

// Middlewares spécifiques
const trialCheck = require('./middleware/trialCheck');
const auth = require('./middleware/auth');

const User = require('./models/User'); // utilisé par /followers
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();

// ✅ CORS en premier
app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ✅ Webhook Stripe monté AVANT express.json()
app.use('/api/stripe/webhook', stripeWebhookRoutes);

// ✅ Parser JSON pour le reste
app.use(express.json());

// ✅ Routes applicatives
app.use('/api/stripe', stripeRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', trialRoutes);

// ✅ Route de santé avec état Mongo
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  let dbStatus = 'disconnected';
  if (mongoState === 1) dbStatus = 'connected';
  else if (mongoState === 2) dbStatus = 'connecting';
  else if (mongoState === 3) dbStatus = 'disconnecting';

  res.status(200).json({
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ✅ Route Followers protégée
app.get('/api/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user?.instagramUserId || !user?.instagramToken) {
      return res.status(400).json({ message: "Instagram non connecté." });
    }

    const { data } = await axios.get(`https://graph.facebook.com/v19.0/${user.instagramUserId}`, {
      params: {
        fields: 'username,followers_count',
        access_token: user.instagramToken, // PAGE access token
      },
    });

    res.json(data);
  } catch (error) {
    console.error('Erreur Instagram Graph API :', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des followers' });
  }
});

// ✅ Fichiers statiques
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;

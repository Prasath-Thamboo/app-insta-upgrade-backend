// app.js - Application Express sans démarrage du serveur
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const stripeRoutes = require('./routes/stripe');
const instagramRoutes = require('./routes/instagram');
const trialRoutes = require('./routes/trial');
const trialCheck = require('./middleware/trialCheck');
const auth = require('./middleware/auth');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');

const app = express();

// ✅ Middleware CORS DOIT être en premier
app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ✅ Routes StripeWebhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripeWebhook'));

// ✅ Middleware JSON
app.use(express.json());

// ✅ Routes Stripe normales
app.use('/api/stripe', stripeRoutes); 
app.use('/api/instagram', instagramRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', trialRoutes);

// ✅ Route Followers
app.get('/api/followers', auth, trialCheck, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.instagramToken) return res.status(401).json({ message: 'Token Instagram non trouvé' });

    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'username,followers_count',
        access_token: user.instagramToken,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erreur Instagram API :', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des followers' });
  }
});

// ✅ Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;

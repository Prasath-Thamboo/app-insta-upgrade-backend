// index.js - Backend principal
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const stripeRoutes = require('./routes/stripe');
const instagramRoutes = require('./routes/instagram');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware CORS DOIT être en premier
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ✅ Routes Stripe
app.use('/api/stripe', stripeRoutes);

// Routes Instagram
app.use('/api/instagram', instagramRoutes); // ✅

// ✅ Middleware JSON
app.use(express.json());

// ✅ Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB:", err));

// ✅ Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);


// ✅ Followers Instagram protégés
app.get('/api/followers', async (req, res) => {
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

// ✅ Lancement serveur
app.listen(PORT, () => {
  console.log(`🚀 Backend en écoute sur http://localhost:${PORT}`);
});

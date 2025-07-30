const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

router.post('/exchange-code', auth, async (req, res) => {
  const { code } = req.body;

  console.log("📤 URI envoyé à Instagram (backend):", INSTAGRAM_REDIRECT_URI);
  console.log("📩 Code reçu du frontend :", code);


  if (!code) {
    return res.status(400).json({ message: 'Code manquant dans la requête.' });
  }

  try {
    // 1. Échange code contre un token court terme
    const qs = new URLSearchParams();
    qs.append('client_id', INSTAGRAM_CLIENT_ID);
    qs.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    qs.append('grant_type', 'authorization_code');
    qs.append('redirect_uri', INSTAGRAM_REDIRECT_URI);
    qs.append('code', code);

    const response = await axios.post('https://api.instagram.com/oauth/access_token', qs, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, user_id } = response.data;

    if (!access_token || !user_id) {
      return res.status(400).json({ message: "Impossible de récupérer les données Instagram." });
    }

    // 2. Échange vers un token long terme
    const longTokenRes = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: INSTAGRAM_CLIENT_SECRET,
        access_token,
      },
    });

    const longAccessToken = longTokenRes.data.access_token;

    // 3. Sauvegarde dans la base de données
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    user.instagramToken = longAccessToken;
    user.instagramUserId = user_id;
    await user.save();

    return res.json({ message: 'Connexion Instagram réussie.' });

  } catch (error) {
    console.error('Erreur Instagram OAuth :', error?.response?.data || error.message);

    if (error.response?.data?.error_message === 'This authorization code has been used') {
      return res.status(400).json({ message: 'Ce code a déjà été utilisé. Veuillez relancer la connexion.' });
    }

    return res.status(500).json({ message: 'Erreur Instagram OAuth.' });
  }
});

module.exports = router;

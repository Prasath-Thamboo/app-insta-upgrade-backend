const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

// 📌 Échange le code contre un token
router.post('/exchange-code', auth, async (req, res) => {
  const { code } = req.body;

  try {
    // 1. Échange le code contre un access token court terme
    const response = await axios.post(`https://api.instagram.com/oauth/access_token`, null, {
      params: {
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      },
    });

    const { access_token, user_id } = response.data;

    // 2. Échange pour obtenir un token long terme
    const longTokenRes = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: INSTAGRAM_CLIENT_SECRET,
        access_token,
      },
    });

    const longAccessToken = longTokenRes.data.access_token;

    // 3. Sauvegarde le token dans la base de données
    const user = await User.findById(req.user._id);
    user.instagramToken = longAccessToken;
    user.instagramUserId = user_id;
    await user.save();

    res.json({ message: 'Connexion Instagram réussie.' });
  } catch (error) {
    console.error('Erreur Instagram OAuth :', error?.response?.data || error.message);
    res.status(500).json({ message: 'Erreur Instagram OAuth' });
  }
});

module.exports = router;

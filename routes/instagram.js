// routes/instagram.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

const FB_APP_ID = process.env.INSTAGRAM_CLIENT_ID;      // App ID Facebook
const FB_APP_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

// 1) Échange code OAuth → long-lived USER token + pages
router.post('/exchange-code', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code manquant.' });

  try {
    // a) Short-lived user token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: { client_id: FB_APP_ID, client_secret: FB_APP_SECRET, redirect_uri: REDIRECT_URI, code },
    });
    const shortUserToken = tokenRes.data.access_token;

    // b) Long-lived user token
    const longRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: { grant_type: 'fb_exchange_token', client_id: FB_APP_ID, client_secret: FB_APP_SECRET, fb_exchange_token: shortUserToken },
    });
    const longUserToken = longRes.data.access_token;

    // c) Récupérer les Pages de l’utilisateur (avec access_token de page)
    const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: longUserToken, fields: 'id,name,access_token' },
    });
    const pages = pagesRes.data?.data || [];

    if (!pages.length) {
      return res.status(400).json({ message: "Aucune Page Facebook détectée. L'IG Business doit être lié à une Page." });
    }

    // d) Si une seule page : on tente l’auto-liaison
    if (pages.length === 1) {
      const page = pages[0];
      const pageToken = page.access_token;

      const pageInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
        params: { fields: 'instagram_business_account', access_token: pageToken },
      });
      const igBizId = pageInfoRes.data?.instagram_business_account?.id;
      if (!igBizId) {
        return res.status(400).json({
          message: "La Page choisie n'a pas de compte Instagram professionnel lié. Liez l’IG dans les paramètres de la Page Facebook.",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

      user.fbUserLongLivedToken = longUserToken;
      user.instagramPageId = page.id;
      user.instagramToken = pageToken;      // Page Access Token
      user.instagramUserId = igBizId;       // IG business user ID
      await user.save();

      return res.json({ message: 'Instagram connecté ✅', instagramUserId: igBizId });
    }

    // e) Sinon, renvoyer la liste pour que le front propose le choix
    return res.json({
      needPageSelection: true,
      pages: pages.map(p => ({ id: p.id, name: p.name })),
    });

  } catch (error) {
    console.error('Erreur Instagram OAuth :', error?.response?.data || error.message);
    return res.status(500).json({ message: 'Erreur Instagram OAuth.' });
  }
});

// 2) L’utilisateur choisit une Page (si plusieurs)
router.post('/select-page', auth, async (req, res) => {
  const { pageId } = req.body;
  if (!pageId) return res.status(400).json({ message: 'pageId manquant.' });

  try {
    const user = await User.findById(req.user._id);
    if (!user?.fbUserLongLivedToken) {
      return res.status(400).json({ message: 'Session Instagram expirée. Reconnectez-vous.' });
    }

    // Re-lister les pages (au cas où)
    const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: user.fbUserLongLivedToken, fields: 'id,name,access_token' },
    });
    const pages = pagesRes.data?.data || [];
    const page = pages.find(p => p.id === pageId);
    if (!page) return res.status(400).json({ message: 'Page introuvable.' });

    const pageToken = page.access_token;

    // Récupérer l’IG business account lié à la page
    const pageInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
      params: { fields: 'instagram_business_account', access_token: pageToken },
    });
    const igBizId = pageInfoRes.data?.instagram_business_account?.id;
    if (!igBizId) {
      return res.status(400).json({
        message: "Cette Page n'a pas de compte Instagram professionnel lié.",
      });
    }

    user.instagramPageId = page.id;
    user.instagramToken = pageToken;
    user.instagramUserId = igBizId;
    await user.save();

    return res.json({ message: 'Page sélectionnée ✅', instagramUserId: igBizId });
  } catch (error) {
    console.error('Erreur select-page :', error?.response?.data || error.message);
    return res.status(500).json({ message: 'Erreur lors de la sélection de la Page.' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ✅ Inscription
router.post('/register', async (req, res) => {
  const {
    email,
    username,
    password,
    instaEmail,
    instaPassword,
    role = 'user' // rôle par défaut
  } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedInstaPassword = await bcrypt.hash(instaPassword, 10);

    const user = new User({
      email,
      username,
      password: hashedPassword,
      instaEmail,
      instaPassword: hashedInstaPassword,
      role
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
  console.log({ email, username, instaEmail, instaPassword });

});

// ✅ Connexion
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) return res.status(401).json({ message: 'Email ou nom d’utilisateur incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Lier le token Instagram
router.post('/connect-instagram', auth, async (req, res) => {
  const { instagramToken } = req.body;
  try {
    req.user.instagramToken = instagramToken;
    await req.user.save();
    res.json({ message: 'Token Instagram enregistré avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Récupérer le nombre de followers
router.get('/followers', auth, async (req, res) => {
  const axios = require('axios');
  try {
    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'username,followers_count',
        access_token: req.user.instagramToken,
      },
    });
    res.json({ ...response.data, username: req.user.username });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des followers' });
  }
});

// ✅ Obtenir les infos du profil
router.get('/me', auth, async (req, res) => {
  try {
    const { username, email, instagramToken, role } = req.user;
    res.json({ username, email, instagramToken, role });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Modifier le username
router.put('/update-username', auth, async (req, res) => {
  const { username } = req.body;
  try {
    req.user.username = username;
    await req.user.save();
    res.json({ message: 'Nom d’utilisateur mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Modifier le mot de passe
router.put('/update-password', auth, async (req, res) => {
  const { password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    req.user.password = hashed;
    await req.user.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Suppression de compte
router.delete('/delete-account', auth, async (req, res) => {
  try {
    await req.user.deleteOne(); // Supprime l'utilisateur connecté
    res.json({ message: 'Compte supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
  }
});

module.exports = router;

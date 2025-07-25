const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const emailValidator = require('email-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');


// ✅ Inscription
router.post('/register', async (req, res) => {
  const {
    email,
    username,
    password,
    instaEmail,
    instaPassword,
    role = 'user'
  } = req.body;

  try {
    if (!emailValidator.validate(email)) {
      return res.status(400).json({ message: 'Adresse email invalide' });
    }

    const allowedDomains = [
      'gmail.com', 'outlook.com', 'hotmail.com', 'hotmail.fr',
      'yahoo.com', 'protonmail.com', 'icloud.com', 'live.com', 'orange.fr', 'free.fr'
    ];
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({
        message: 'Domaine email non autorisé. Utilisez un fournisseur connu.'
      });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedInstaPassword = await bcrypt.hash(instaPassword, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email,
      username,
      password: hashedPassword,
      instaEmail,
      instaPassword: hashedInstaPassword,
      role,
      emailVerificationToken,
      isEmailVerified: false
    });

    await user.save();

    const verifyUrl = `http://localhost:3001/api/verify-email/${emailVerificationToken}`;
    await sendEmail(email, 'Vérification de votre email', `Cliquez ici pour vérifier votre compte : ${verifyUrl}`);

    res.status(201).json({ message: 'Inscription réussie. Veuillez vérifier votre email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Vérification de l'email
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).send('Token invalide ou expiré.');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).send('Email vérifié avec succès. Vous pouvez maintenant vous connecter.');
  } catch (err) {
    console.error('Erreur vérification :', err);
    res.status(500).send('Erreur serveur');
  }
});

// ✅ Renvoyer l’email de vérification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email déjà vérifié" });

    // Générer un nouveau token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    // Renvoyer l’email
    const verifyUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    await sendEmail(email, 'Vérification de votre email', `Cliquez ici pour valider votre compte : ${verifyUrl}`);

    res.json({ message: "Email de confirmation renvoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'envoi de l’email" });
  }
});


// ✅ Connexion
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });
    if (!user) return res.status(401).json({ message: 'Email ou nom d’utilisateur incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Veuillez vérifier votre adresse email avant de vous connecter.' });
    }

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
    const { username, email, instagramToken, role, profilePicture, dashboardStyle } = req.user;
    res.json({ username, email, instagramToken, role, profilePicture, dashboardStyle });
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
    await req.user.deleteOne();
    res.json({ message: 'Compte supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
  }
});

// PUT /api/update-profile-picture
router.put('/update-profile-picture', auth, async (req, res) => {
  const { profilePicture } = req.body;

  try {
    req.user.profilePicture = profilePicture;
    await req.user.save();
    res.json({ message: 'Photo de profil mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Upload d'une photo de profil
router.post('/upload-profile-picture', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucune image envoyée' });

  try {
    req.user.profilePicture = `http://localhost:3001/uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ message: 'Photo de profil mise à jour', url: req.user.profilePicture });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Modifier le style du dashboard
router.put('/update-style', auth, async (req, res) => {
  const { dashboardStyle } = req.body;

  if (!dashboardStyle) {
    return res.status(400).json({ message: 'Style requis' });
  }

  try {
    req.user.dashboardStyle = dashboardStyle;
    await req.user.save();
    res.json({ message: 'Style mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

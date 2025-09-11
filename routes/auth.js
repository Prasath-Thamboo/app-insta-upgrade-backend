// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const trialCheck = require('../middleware/trialCheck');
const upload = require('../middleware/upload');
const emailValidator = require('email-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const checkSubscription = require('../middleware/checkSubscription');
// ⬇️ Cloudinary
const cloudinary = require('../config/cloudinary');

// ⬇️ Templates email (NOUVEAU)
const {
  buildVerifyEmailText,
  buildVerifyEmailHtml,
  buildResetText,
  buildResetHtml,
  buildContactText,
  buildContactHtml,
} = require('../utils/emailTemplates');

// Variables d’app (utilisées pour les emails)
const APP_NAME = process.env.APP_NAME || 'VotreApp';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@votredomaine.com';
const LOGO_URL = process.env.LOGO_URL || ''; // Laisse vide si pas de logo

// ✅ Inscription
router.post('/register', async (req, res) => {
  const {
    email,
    username,
    password,
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
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email,
      username,
      password: hashedPassword,
      role: 'freeuser', // 👈 Par défaut
      isSubscribed: false,
      emailVerificationToken,
      isEmailVerified: false
    });

    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

    // ⬇️ Email HTML + texte (NOUVEAU)
    await sendEmail(
      email,
      'Activez votre compte 🚀',
      buildVerifyEmailText(verifyUrl, APP_NAME, SUPPORT_EMAIL),
      buildVerifyEmailHtml(verifyUrl, APP_NAME, SUPPORT_EMAIL, LOGO_URL)
    );

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

    res.status(200).json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });

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
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail(
      email,
      'Confirmez votre adresse email ✉️',
      buildVerifyEmailText(verifyUrl, APP_NAME, SUPPORT_EMAIL),
      buildVerifyEmailHtml(verifyUrl, APP_NAME, SUPPORT_EMAIL, LOGO_URL)
    );

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


// ✅ Mettre à jour son propre token Instagram (user, testeur, admin)
router.post('/users/token', auth, async (req, res) => {
  let { instagramToken } = req.body;
  instagramToken = (instagramToken || '').trim();
  if (!instagramToken || instagramToken.toLowerCase() === 'null') {
    return res.status(400).json({ message: 'Token requis' });
  }

  try {
    req.user.instagramToken = instagramToken;
    await req.user.save();

    res.json({ message: 'Token Instagram mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur mise à jour token Instagram :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



// ✅ Lier le token Instagram
router.post('/connect-instagram', auth, async (req, res) => {
  let { instagramToken } = req.body;
  instagramToken = (instagramToken || '').trim();

  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Bloquer les freeuser
    if (!['user', 'testeur'].includes(user.role)) {
      return res.status(403).json({ message: "Vous n’avez pas accès à cette fonctionnalité." });
    }

    if (!instagramToken || instagramToken.toLowerCase() === 'null') {
      return res.status(400).json({ message: 'Token Instagram invalide.' });
    }

    user.instagramToken = instagramToken;
    await user.save();

    res.json({ message: 'Token Instagram enregistré avec succès' });
  } catch (err) {
    console.error('connect-instagram error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// ✅ Récupérer le nombre de followers
router.get('/followers', auth, checkSubscription, trialCheck, async (req, res) => {
  const axios = require('axios');

  // Sécurisation: bloquer si le token est absent/vidé/"null"
  const tokenValue = (req.user.instagramToken || '').trim();
  if (!tokenValue || tokenValue.toLowerCase() === 'null') {
    return res.status(400).json({
      message: 'Instagram token manquant. Veuillez connecter votre compte Instagram.'
    });
  }

  try {
    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'username,followers_count',
        access_token: tokenValue,
      },
    });

    res.json({
      igUsername: response.data.username,          // 👈 Username Instagram
      followersCount: response.data.followers_count, // 👈 Followers Instagram
    });

  } catch (err) {
    console.error('Erreur IG Graph:', err?.response?.data || err.message);
    const status = err?.response?.status === 400 || err?.response?.status === 401 ? 401 : 500;
    res.status(status).json({ message: 'Erreur lors de la récupération des followers' });
  }
});


// ✅ Obtenir les infos du profil
router.get('/me', auth, async (req, res) => {
  try {
    // Selon ton middleware, l'ID peut être dans id, _id, ou directement req.user
    const userId = req.user?.id || req.user?._id || req.user;
    const user = await User.findById(userId)
      .select('-password -resetToken -resetTokenExpire -emailVerificationToken');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture || '',
      dashboardStyle: user.dashboardStyle || 'classic',
      instagramToken: user.instagramToken || '',
      isSubscribed: !!user.isSubscribed,              // ✅ le champ manquant
      stripeCustomerId: user.stripeCustomerId || null,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
    });
  } catch (err) {
    console.error('GET /api/me error:', err);
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

// ✅ Upload d'une photo de profil (Cloudinary overwrite)
router.post('/upload-profile-picture', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image envoyée' });

    const publicId = `users/${req.user._id}/avatar`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
        },
        (err, uploadResult) => (err ? reject(err) : resolve(uploadResult))
      );
      stream.end(req.file.buffer);
    });

    req.user.profilePicture = result.secure_url;          // URL versionnée (v###)
    req.user.profilePicturePublicId = result.public_id;   // "users/<id>/avatar"
    await req.user.save();

    res.json({ message: 'Photo de profil mise à jour', url: req.user.profilePicture });
  } catch (err) {
    if (err?.message === 'FORMAT_NOT_ALLOWED') {
      return res.status(415).json({ message: 'Formats autorisés: JPG, PNG, WEBP' });
    }
    console.error('Erreur lors de la mise à jour de la photo :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Supprimer la photo de profil (Cloudinary)
router.delete('/delete-profile-picture', auth, async (req, res) => {
  try {
    const publicId = req.user.profilePicturePublicId || `users/${req.user._id}/avatar`;

    await cloudinary.uploader.destroy(publicId, { invalidate: true });

    req.user.profilePicture = '';
    req.user.profilePicturePublicId = '';
    await req.user.save();

    res.json({ message: 'Photo de profil supprimée' });
  } catch (err) {
    console.error('Suppression avatar :', err);
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

// ✅ Route de contact
router.post('/contact', async (req, res) => {
  const { firstname, lastname, email, message } = req.body;

  if (!firstname || !lastname || !email || !message) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Message de ${firstname} ${lastname}`,
      buildContactText({ firstname, lastname, email, message }),
      buildContactHtml({ firstname, lastname, email, message })
    );

    res.json({ message: 'Votre message a été envoyé avec succès.' });
  } catch (err) {
    console.error("Erreur envoi email contact :", err);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email." });
  }
});

// ✅ Mot de passe oublié 
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpire = Date.now() + 1000 * 60 * 60; // 1h

    user.resetToken = token;
    user.resetTokenExpire = tokenExpire;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendEmail(
      user.email,
      'Réinitialisation du mot de passe',
      buildResetText(resetLink, APP_NAME),
      buildResetHtml(resetLink, APP_NAME)
    );

    res.json({ message: 'Lien de réinitialisation envoyé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mot de passe reset
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

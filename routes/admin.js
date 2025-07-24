// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// ✅ Voir tous les utilisateurs
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password -instaPassword');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Supprimer un utilisateur
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Changer le rôle d’un utilisateur
router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.role = role;
    await user.save();
    res.json({ message: `Rôle mis à jour en "${role}"` });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Modifier les infos d’un utilisateur
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  const { email, username, instaEmail } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (email) user.email = email;
    if (username) user.username = username;
    if (instaEmail) user.instaEmail = instaEmail;

    await user.save();
    res.json({ message: 'Informations utilisateur mises à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Mettre à jour le token Instagram d’un utilisateur
router.put('/users/:id/token', auth, isAdmin, async (req, res) => {
  const { instagramToken } = req.body;

  if (instagramToken === undefined) {
  return res.status(400).json({ message: 'Token requis' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.instagramToken = instagramToken;
    await user.save();

    res.json({ message: 'Token Instagram mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
  });

module.exports = router;

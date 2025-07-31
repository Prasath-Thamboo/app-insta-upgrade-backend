const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ✅ Lancer l’essai gratuit (7 jours)
router.post('/start-trial', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // ❌ Bloque si l'utilisateur est déjà testeur ou user
    if (user.role === 'testeur') {
      return res.status(400).json({ message: "Vous avez déjà activé l'essai gratuit." });
    }

    if (user.role === 'user') {
      return res.status(400).json({ message: "Vous êtes déjà abonné." });
    }

    // ✅ Mise à jour du rôle et de la date de début d’essai
    user.role = 'testeur';
    user.trialStart = new Date();
    await user.save();

    res.json({ message: "Essai gratuit activé pour 7 jours." });
  } catch (err) {
    console.error("Erreur activation essai gratuit :", err);
    res.status(500).json({ message: "Erreur lors de l'activation de l'essai." });
  }
});


module.exports = router;

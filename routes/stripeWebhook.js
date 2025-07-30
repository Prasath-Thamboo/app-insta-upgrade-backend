const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Erreur vérification signature webhook :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Gérer les événements pertinents
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (!userId) {
      console.warn('⚠️ Aucun userId dans metadata');
    } else {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.role = 'user';
          user.isSubscribed = true;
          user.subscriptionStart = new Date();
          await user.save();
          console.log(`✅ Abonnement activé pour ${user.email}`);
        } else {
          console.warn(`⚠️ Utilisateur non trouvé pour l’ID ${userId}`);
        }
      } catch (err) {
        console.error('❌ Erreur mise à jour utilisateur :', err);
      }
    }
  } else {
    console.log(`ℹ️ Événement non géré : ${event.type}`);
  }

  res.sendStatus(200);
});

module.exports = router;

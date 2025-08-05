// routes/stripe.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User');
const bodyParser = require('body-parser');

// ✅ Créer une session de paiement Stripe
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID, // ✅ ID du prix Stripe
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        userId: req.user._id.toString(), // 👈 Pour mise à jour post-paiement
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Erreur création session Stripe :', err);
    res.status(500).json({ message: 'Erreur Stripe' });
  }
});

// ✅ Webhook Stripe
// Stripe recommande raw body pour vérifier la signature
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    try {
      const user = await User.findById(userId);
      if (user) {
        user.role = 'user';
        user.isSubscribed = true;
        user.subscriptionStart = new Date();
        await user.save();
        console.log(`✅ Abonnement activé pour ${user.email}`);
      }
    } catch (err) {
      console.error('❌ Erreur mise à jour utilisateur :', err);
    }
  }

  res.status(200).send();
});


module.exports = router;

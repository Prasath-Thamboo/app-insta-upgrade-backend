// routes/stripeWebhook.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const mongoose = require('mongoose');
const User = require('../models/User');

// ⚠️ Ce router est monté via app.use('/api/stripe/webhook', router) AVANT express.json()
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Erreur vérification signature webhook :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // (Optionnel) Idempotence simple
  try {
    const already = await mongoose.connection.db.collection('stripe_events').findOne({ id: event.id });
    if (already) return res.status(200).send('Event already processed');
    await mongoose.connection.db.collection('stripe_events').insertOne({ id: event.id, type: event.type, createdAt: new Date() });
  } catch (e) {
    console.warn('⚠️ Idempotency warn:', e.message);
  }

  const ON_STATUSES = new Set(['active', 'trialing', 'past_due']); // ajuste selon ta politique

const setUserSubscription = async ({ user, customerId, subscriptionId, status }) => {
  const isSubscribed = ON_STATUSES.has((status || '').toLowerCase());
  const update = {
    isSubscribed,
    ...(customerId && { stripeCustomerId: customerId }),
    ...(subscriptionId && { stripeSubscriptionId: subscriptionId }),
    ...(isSubscribed ? { subscriptionStart: new Date(), role: 'user' } : { role: 'freeuser' }) 
    // 👆 Passe en 'user' si abonné, sinon en 'freeuser'
  };

  const filter = user ? { _id: user._id } : { stripeCustomerId: customerId };
  await User.updateOne(filter, { $set: update });
};

  const findUserFromSession = async (session) => {
    if (session?.metadata?.userId) {
      const u = await User.findById(session.metadata.userId);
      if (u) return u;
    }
    if (session?.client_reference_id) {
      const u = await User.findById(session.client_reference_id);
      if (u) return u;
    }
    if (session?.customer) {
      const u = await User.findOne({ stripeCustomerId: session.customer });
      if (u) return u;
    }
    if (session?.customer_details?.email) {
      const u = await User.findOne({ email: session.customer_details.email.toLowerCase() });
      if (u) return u;
    }
    return null;
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = session.subscription;
        let status = 'active';
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = sub.status;
        }
        const user = await findUserFromSession(session);
        await setUserSubscription({
          user,
          customerId: session.customer,
          subscriptionId,
          status
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        const subscriptionId = inv.subscription;
        const customerId = inv.customer;
        let status = 'active';
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = sub.status;
        }
        const user = await User.findOne({ stripeCustomerId: customerId });
        await setUserSubscription({ user, customerId, subscriptionId, status });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const user = await User.findOne({ stripeCustomerId: sub.customer });
        await setUserSubscription({
          user,
          customerId: sub.customer,
          subscriptionId: sub.id,
          status: sub.status
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = await User.findOne({ stripeCustomerId: sub.customer });
        await setUserSubscription({
          user,
          customerId: sub.customer,
          subscriptionId: sub.id,
          status: 'canceled'
        });
        break;
      }

      default:
        console.log(`ℹ️ Événement non géré : ${event.type}`);
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Webhook handler error');
  }
});

module.exports = router;

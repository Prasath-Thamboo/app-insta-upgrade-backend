// middleware/trialCheck.js
const User = require('../models/User');

const trialCheck = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role === 'testeur' && user.trialEnds && user.trialEnds < new Date()) {
      console.log(`[trialCheck] Essai terminé pour ${user.username}. Passage en freeuser + suppression du token.`);

      user.role = 'freeuser';
      user.instagramToken = null;
      user.instagramUserId = null;
      await user.save();
    }

    next();
  } catch (err) {
    console.error('[trialCheck] Erreur middleware :', err);
    next(); // on passe quand même pour ne pas bloquer la requête
  }
};

module.exports = trialCheck;
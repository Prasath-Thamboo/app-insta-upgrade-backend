module.exports = (req, res, next) => {
  const user = req.user;

  // L’utilisateur "admin" ou "user" payant passe toujours
  if (user.role === 'admin' || user.role === 'user') {
    return next();
  }

  // Si c’est un freeuser, on vérifie la date
  const now = new Date();
  const trialStart = new Date(user.trialStart);
  const diffInMs = now - trialStart;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays > 7) {
    return res.status(403).json({
      message: "Votre période d’essai gratuit est expirée. Veuillez souscrire pour continuer."
    });
  }

  next();
};

// index.js - Entrée serveur (connexion DB + listen)
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connecté');
  app.listen(PORT, () => {
    console.log(`🚀 Backend en écoute sur le port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ Erreur MongoDB:', err);
  process.exit(1);
});

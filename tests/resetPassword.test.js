// tests/resetPassword.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ✅ Connexion à une base de test isolée
beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db-reset');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany(); // Nettoyer la base avant chaque test
});

describe('POST /api/reset-password/:token', () => {
  it('doit réinitialiser le mot de passe avec un token valide', async () => {
    // 🔹 Création utilisateur avec token
    const hashedPassword = await bcrypt.hash('oldpassword', 10);
    const user = await User.create({
      email: 'reset@example.com',
      username: 'resetuser',
      password: hashedPassword,
      resetToken: 'valid-token',
      resetTokenExpire: Date.now() + 60 * 60 * 1000, // 1h
      isEmailVerified: true
    });

    const res = await request(app)
      .post(`/api/reset-password/${user.resetToken}`)
      .send({ newPassword: 'newpassword123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Mot de passe réinitialisé');

    // ✅ Vérifier que le mot de passe a changé
    const updatedUser = await User.findById(user._id);
    const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
    expect(isMatch).toBe(true);
  });

  it('doit renvoyer une erreur si le token est invalide ou expiré', async () => {
    const res = await request(app)
      .post('/api/reset-password/token-invalide')
      .send({ newPassword: 'whatever' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Token invalide ou expiré');
  });
});

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany();
});

describe('POST /api/reset-password/:token', () => {
  it('réinitialise le mot de passe avec un token valide', async () => {
    const token = 'valid-token';
    const oldHashedPassword = await bcrypt.hash('oldPassword', 10);

    const user = await User.create({
      email: 'resetuser@example.com',
      username: 'resetuser',
      password: oldHashedPassword,
      resetToken: token,
      resetTokenExpire: Date.now() + 1000 * 60 * 10, // +10 minutes
      isEmailVerified: true
    });

    const res = await request(app)
      .post(`/api/reset-password/${token}`)
      .send({ newPassword: 'newStrongPassword123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Mot de passe réinitialisé');

    const updatedUser = await User.findById(user._id);
    const passwordMatch = await bcrypt.compare('newStrongPassword123', updatedUser.password);
    expect(passwordMatch).toBe(true);
    expect(updatedUser.resetToken).toBeUndefined();
    expect(updatedUser.resetTokenExpire).toBeUndefined();
  });

  it('renvoie une erreur pour un token invalide', async () => {
    const res = await request(app)
      .post('/api/reset-password/invalid-token')
      .send({ newPassword: 'newPassword123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Token invalide ou expiré');
  });

  it('renvoie une erreur si le token est expiré', async () => {
    const expiredToken = 'expired-token';

    await User.create({
      email: 'expired@example.com',
      username: 'expireduser',
      password: await bcrypt.hash('password', 10),
      resetToken: expiredToken,
      resetTokenExpire: Date.now() - 1000, // Token expiré
      isEmailVerified: true
    });

    const res = await request(app)
      .post(`/api/reset-password/${expiredToken}`)
      .send({ newPassword: 'newPassword123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Token invalide ou expiré');
  });
});

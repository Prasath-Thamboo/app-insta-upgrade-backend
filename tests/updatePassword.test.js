const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

describe('PUT /api/update-password', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/test-db-update-password');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('doit mettre à jour le mot de passe si utilisateur authentifié', async () => {
    const hashedPassword = await bcrypt.hash('oldPassword', 10);
    const user = await User.create({
      email: 'updatepw@example.com',
      username: 'userupdatepw',
      password: hashedPassword,
      isEmailVerified: true
    });

    // Générer un token JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .put('/api/update-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newPassword123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Mot de passe mis à jour');

    const updatedUser = await User.findById(user._id);
    const isMatch = await bcrypt.compare('newPassword123', updatedUser.password);
    expect(isMatch).toBe(true);
  });
});

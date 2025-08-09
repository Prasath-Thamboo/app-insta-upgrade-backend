// tests/updateUsername.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

beforeAll(async () => {
  // Base dédiée à ce fichier
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db-update-username');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('PUT /api/update-username', () => {
  it("met à jour le nom d’utilisateur quand l’utilisateur est authentifié", async () => {
    const user = await User.create({
      email: 'john@example.com',
      username: 'john',
      password: await bcrypt.hash('password123', 10),
      isEmailVerified: true,
    });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .put('/api/update-username')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'johnny' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Nom d’utilisateur mis à jour");

    const updated = await User.findById(user._id);
    expect(updated.username).toBe('johnny');
  });

  it('renvoie 401 si aucun token JWT n’est fourni', async () => {
    const res = await request(app)
      .put('/api/update-username')
      .send({ username: 'nouveau' });

    expect(res.statusCode).toBe(401);
  });
});

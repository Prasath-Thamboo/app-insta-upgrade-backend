const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

jest.mock('../utils/sendEmail', () => jest.fn());
const sendEmail = require('../utils/sendEmail');

describe('POST /api/resend-verification', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/test-db-email-verification');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    sendEmail.mockClear();
  });

  it('doit renvoyer un nouvel email si utilisateur non vérifié', async () => {
    await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: await bcrypt.hash('password123', 10),
      isEmailVerified: false
    });

    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: 'test@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Email de confirmation renvoyé.');
    expect(sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      expect.stringContaining('Cliquez ici')
    );
  });

  it('doit renvoyer une erreur si utilisateur déjà vérifié', async () => {
    await User.create({
      email: 'verified@example.com',
      username: 'verifieduser',
      password: await bcrypt.hash('password123', 10),
      isEmailVerified: true
    });

    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: 'verified@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email déjà vérifié');
  });
});

// tests/emailVerification.test.js
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

    // ✅ Vérifie l'appel à sendEmail avec 4 arguments : to, subject, text, html
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, text, html] = sendEmail.mock.calls[0];

    expect(to).toBe('test@example.com');
    expect(subject).toMatch(/(confirmez|vérification|activez)/i);

    // Le texte brut doit contenir l'URL /verify-email/<token 64 hex>
    expect(text).toMatch(/\/verify-email\/[a-f0-9]{64}/i);

    // L'HTML doit contenir le lien bouton vers la route de vérification
    expect(html).toMatch(/href="http:\/\/localhost:5173\/verify-email\/[a-f0-9]{64}"/i);
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

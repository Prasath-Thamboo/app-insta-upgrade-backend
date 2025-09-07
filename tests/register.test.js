// tests/register.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// Mock de sendEmail pour éviter les vrais envois
jest.mock('../utils/sendEmail', () => jest.fn());
const sendEmail = require('../utils/sendEmail');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db-register');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  sendEmail.mockClear();
});

describe('POST /api/register', () => {
  const endpoint = '/api/register';

  it("crée l'utilisateur et envoie l'email de vérification (201)", async () => {
    const payload = {
      email: 'newuser@gmail.com',
      username: 'newuser',
      password: 'StrongPass123!',
    };

    sendEmail.mockResolvedValue({ accepted: [payload.email] });

    const res = await request(app).post(endpoint).send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/Inscription réussie/i);

    const user = await User.findOne({ email: payload.email });
    expect(user).toBeTruthy();
    expect(user.username).toBe(payload.username);
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerificationToken).toBeDefined();
    expect(user.role).toBe('freeuser');

    // ✅ Vérifie l'appel à sendEmail avec 4 arguments : to, subject, text, html
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, text, html] = sendEmail.mock.calls[0];

    expect(to).toBe(payload.email);
    // sujet flexible : gère "Vérification", "Activez votre compte", "Confirmez votre adresse", etc.
    expect(subject).toMatch(/(vérification|activez|confirmez)/i);

    // Le texte brut contient l'URL /verify-email/<token 64 hex>
    expect(text).toMatch(/\/verify-email\/[a-f0-9]{64}/i);

    // L'HTML contient le lien bouton vers la même route
    expect(html).toMatch(/href="http:\/\/localhost:5173\/verify-email\/[a-f0-9]{64}"/i);
  });

  it('refuse un email invalide (400)', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'pas-un-email',
      username: 'x',
      password: 'y',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Adresse email invalide/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('refuse un domaine non autorisé (400)', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'user@domaine-inconnu.xyz',
      username: 'userx',
      password: 'pass',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Domaine email non autorisé/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('refuse un email déjà existant (400)', async () => {
    await User.create({
      email: 'dup@gmail.com',
      username: 'dup1',
      password: 'hash',
      isEmailVerified: false,
    });

    const res = await request(app).post(endpoint).send({
      email: 'dup@gmail.com',
      username: 'dup2',
      password: 'pass',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Utilisateur déjà existant/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

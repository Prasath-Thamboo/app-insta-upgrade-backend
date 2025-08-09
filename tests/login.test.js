// tests/login.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ✅ Connexion à une base de test isolée
beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db-login');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany(); // Nettoyer uniquement cette base
});

describe('POST /api/login', () => {
  it('doit se connecter avec email et mot de passe corrects', async () => {
    const hashedPassword = await bcrypt.hash('mypassword', 10);

    await User.create({
      email: 'login@example.com',
      username: 'loginuser',
      password: hashedPassword,
      isEmailVerified: true
    });

    const res = await request(app)
      .post('/api/login')
      .send({ emailOrUsername: 'login@example.com', password: 'mypassword' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('doit refuser si le mot de passe est incorrect', async () => {
    const hashedPassword = await bcrypt.hash('mypassword', 10);

    await User.create({
      email: 'wrongpass@example.com',
      username: 'wrongpass',
      password: hashedPassword,
      isEmailVerified: true
    });

    const res = await request(app)
      .post('/api/login')
      .send({ emailOrUsername: 'wrongpass@example.com', password: 'badpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Mot de passe incorrect');
  });

  it('doit refuser si l’utilisateur n’existe pas', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ emailOrUsername: 'unknown@example.com', password: 'test' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Email ou nom d’utilisateur incorrect');
  });

  it('doit refuser si l’email n’est pas vérifié', async () => {
    const hashedPassword = await bcrypt.hash('mypassword', 10);

    await User.create({
      email: 'unverified@example.com',
      username: 'unverified',
      password: hashedPassword,
      isEmailVerified: false
    });

    const res = await request(app)
      .post('/api/login')
      .send({ emailOrUsername: 'unverified@example.com', password: 'mypassword' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Veuillez vérifier votre adresse email avant de vous connecter.');
  });
});

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// 👇 Mock complet de sendEmail
jest.mock('../utils/sendEmail', () => jest.fn());
const sendEmail = require('../utils/sendEmail');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany();
  sendEmail.mockClear(); // 👈 Reset du mock
});

describe('POST /api/auth/forgot-password', () => {
  const endpoint = '/api/auth/forgot-password';

  it('doit renvoyer un message de succès si l’utilisateur existe', async () => {
    // 👤 Créer un utilisateur test
    await User.create({
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      isEmailVerified: true
    });

    // 👨‍🔬 Mock de l’email
    sendEmail.mockResolvedValue({ accepted: ['testuser@example.com'] });

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'testuser@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Lien de réinitialisation envoyé');
    expect(sendEmail).toHaveBeenCalledWith(
      'testuser@example.com',
      expect.any(String),
      expect.stringContaining('Cliquez ici')
    );
  });

  it('doit renvoyer une erreur si l’utilisateur n’existe pas', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ email: 'unknown@example.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Utilisateur non trouvé');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

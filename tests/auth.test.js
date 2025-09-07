const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// 👇 Mock complet de sendEmail (pas d'email réel en test)
jest.mock('../utils/sendEmail', () => jest.fn());
const sendEmail = require('../utils/sendEmail');

beforeAll(async () => {
  // ⚠️ DB dédiée à ce fichier de tests pour éviter les collisions
  await mongoose.connect('mongodb://127.0.0.1:27017/test-db-auth', {
    // options v3/4 legacy tolérées, sinon laisse vide
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  sendEmail.mockClear();
});

describe('POST /api/forgot-password', () => {
  const endpoint = '/api/forgot-password'; // correspond à app.use("/api", authRoutes)

  it("doit renvoyer un message de succès si l’utilisateur existe", async () => {
    // 👤 Créer un utilisateur test
    await User.create({
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      isEmailVerified: true,
    });

    // 👨‍🔬 Mock de l’email
    sendEmail.mockResolvedValue({ accepted: ['testuser@example.com'] });

    const res = await request(app).post(endpoint).send({ email: 'testuser@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Lien de réinitialisation envoyé');

    // ✅ Vérifie l'appel avec 4 arguments: to, subject, text, html
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, text, html] = sendEmail.mock.calls[0];

    expect(to).toBe('testuser@example.com');
    expect(subject).toMatch(/réinitialisation du mot de passe/i);

    // le texte brut doit contenir une URL /reset-password/<token 64 hex>
    expect(text).toMatch(/\/reset-password\/[a-f0-9]{64}/i);

    // l'HTML doit contenir le lien bouton vers la même route
    expect(html).toMatch(/href="http:\/\/localhost:5173\/reset-password\/[a-f0-9]{64}"/i);

    // Vérifie que le token a bien été posé
    const updated = await User.findOne({ email: 'testuser@example.com' });
    expect(updated.resetToken).toBeDefined();
    expect(updated.resetTokenExpire).toBeDefined();
  });

  it("doit renvoyer une erreur si l’utilisateur n’existe pas", async () => {
    const res = await request(app).post(endpoint).send({ email: 'unknown@example.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Utilisateur non trouvé');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

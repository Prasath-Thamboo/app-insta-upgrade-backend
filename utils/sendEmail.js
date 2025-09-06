const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Counter-inst" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text, // fallback en texte brut (obligatoire pour certains clients mail)
    html, // version HTML stylisée
  });

  console.log(`✅ Email envoyé à ${to}`);
  return info;
};

module.exports = sendEmail;

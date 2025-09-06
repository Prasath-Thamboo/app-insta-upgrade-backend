// utils/emailTemplates.js

function layoutWrapper(innerHtml, { appName = 'Counter-inst', supportEmail = 'prasath1@hotmail.fr', logoUrl = 'https://counter-inst.com/insta-logo.png' } = {}) {
  return `
  <!doctype html>
  <html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${appName}</title>
    <style>
      @media (max-width: 600px) {
        .container { width: 100% !important; }
        .btn { width: 100% !important; text-align: center !important; }
      }
      @media (prefers-color-scheme: dark) {
        .bg { background: #0b0f19 !important; }
        .card { background: #101826 !important; }
        .text { color: #e5e7eb !important; }
        .muted { color: #9ca3af !important; }
        .btn { background: #3b82f6 !important; color:#fff !important; }
      }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    </style>
  </head>
  <body class="bg" style="margin:0;padding:0;background:#f4f5f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
            <tr>
              <td align="center" style="padding:16px 0;">
                ${logoUrl ? `<img src="${logoUrl}" width="120" alt="${appName}" style="display:block;border:0;">`
                          : `<div style="font:600 20px/1 Arial,Helvetica,sans-serif;color:#111827">${appName}</div>`}
              </td>
            </tr>
            <tr>
              <td class="card" style="background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 8px;">
                <p class="muted" style="margin:0;font:400 11px/1.6 Arial,Helvetica,sans-serif;color:#9ca3af;">
                  © ${new Date().getFullYear()} ${appName}. Tous droits réservés. — <a href="mailto:${supportEmail}" style="color:#2563eb">Support</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

/* ============================
   Vérification email
   ============================ */
function buildVerifyEmailText(verifyUrl, appName = 'Counter-inst', supportEmail = 'prasath1@hotmail.fr') {
  return [
    `Bienvenue sur ${appName} !`,
    ``,
    `Merci pour votre inscription.`,
    `Pour activer votre compte, cliquez sur le lien ci-dessous :`,
    verifyUrl,
    ``,
    `Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.`,
    ``,
    `Besoin d’aide ? ${supportEmail}`,
  ].join('\n');
}

function buildVerifyEmailHtml(verifyUrl, appName = 'Counter-inst', supportEmail = 'prasath1@hotmail.fr', logoUrl = 'https://counter-inst.com/insta-logo.png') {
  const inner = `
    <h1 class="text" style="margin:0 0 12px;font:700 20px/1.3 Arial,Helvetica,sans-serif;color:#111827;">Bienvenue 👋</h1>
    <p class="text" style="margin:0 0 12px;color:#111827;">Merci de vous être inscrit(e) sur <strong>${appName}</strong>.</p>
    <p class="text" style="margin:0 0 20px;color:#111827;">Pour <strong>activer votre compte</strong>, cliquez sur le bouton ci-dessous :</p>
    <a class="btn" href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Vérifier mon email
    </a>
    <p class="muted" style="margin:20px 0 6px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#6b7280;">Lien de vérification :</p>
    <p style="margin:0 0 16px;word-break:break-all;font:12px/1.6 Consolas,Monaco,monospace;">
      <a href="${verifyUrl}" style="color:#2563eb;text-decoration:underline;">${verifyUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <p class="muted" style="margin:0 0 6px;font:12px/1.6 Arial,Helvetica,sans-serif;color:#6b7280;">
      Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.
    </p>
    <p class="muted" style="margin:0;font:12px/1.6 Arial,Helvetica,sans-serif;color:#6b7280;">
      Besoin d’aide ? <a href="mailto:${supportEmail}" style="color:#2563eb">Contactez-nous</a>
    </p>
  `;
  return layoutWrapper(inner, { appName, supportEmail, logoUrl });
}

/* ============================
   Réinitialisation mot de passe
   ============================ */
function buildResetText(resetLink, appName = 'Counter-inst') {
  return [
    `Réinitialisation du mot de passe — ${appName}`,
    ``,
    `Pour choisir un nouveau mot de passe, cliquez :`,
    resetLink,
    ``,
    `Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.`
  ].join('\n');
}

function buildResetHtml(resetLink, appName = 'Counter-inst', logoUrl = 'https://counter-inst.com/insta-logo.png', supportEmail = 'prasath1@hotmail.fr') {
  const inner = `
    <h2 class="text" style="margin:0 0 12px;font:700 20px/1.3 Arial;color:#111827;">Réinitialisation du mot de passe</h2>
    <p class="text" style="margin:0 0 16px;color:#111827;">Cliquez sur le bouton pour définir un nouveau mot de passe.</p>
    <a class="btn" href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Réinitialiser mon mot de passe
    </a>
    <p class="muted" style="margin:20px 0 6px;font:12px/1.6 Arial;color:#6b7280;">Lien direct :</p>
    <p style="margin:0;word-break:break-all;font:12px/1.6 Consolas,Monaco,monospace;">
      <a href="${resetLink}" style="color:#2563eb;text-decoration:underline;">${resetLink}</a>
    </p>
  `;
  return layoutWrapper(inner, { appName, supportEmail, logoUrl });
}

/* ============================
   Formulaire de contact (admin)
   ============================ */
function buildContactText({ firstname, lastname, email, message }) {
  return `Message de ${firstname} ${lastname}

Email: ${email}

${message}`;
}

function buildContactHtml({ firstname, lastname, email, message }, appName = 'Counter-inst', logoUrl = 'https://counter-inst.com/insta-logo.png') {
  const inner = `
    <h2 class="text" style="margin:0 0 12px;font:700 18px/1.3 Arial;color:#111827;">Nouveau message du formulaire</h2>
    <p class="text" style="margin:0 0 8px;color:#111827;"><strong>Nom :</strong> ${firstname} ${lastname}</p>
    <p class="text" style="margin:0 0 16px;color:#111827;"><strong>Email :</strong> <a href="mailto:${email}" style="color:#2563eb">${email}</a></p>
    <p class="text" style="white-space:pre-line;margin:0;color:#111827;">${message}</p>
  `;
  return layoutWrapper(inner, { appName, logoUrl });
}

module.exports = {
  buildVerifyEmailText,
  buildVerifyEmailHtml,
  buildResetText,
  buildResetHtml,
  buildContactText,
  buildContactHtml,
};

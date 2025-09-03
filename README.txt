# Instagram Followers Upgrade - README

## 📌 Présentation du projet
Ce projet est une application web permettant aux utilisateurs de suivre l’évolution de leurs abonnés Instagram en temps réel, avec des fonctionnalités de personnalisation, de gestion de compte, d’abonnement et de conformité RGPD.  

Le projet est découpé en plusieurs parties :
- **Frontend** : Développé en React (Vite), avec TailwindCSS.
- **Backend** : Développé en Node.js / Express.
- **Base de données** : MongoDB (via Mongoose).
- **Paiement** : Stripe pour la gestion des abonnements récurrents.
- **Hébergement** : Docker + Render/Amazon Lightsail (selon déploiement).
- **Sécurité & RGPD** : JWT, CORS, consentement cookies, SSL.

---

## ⚙️ Fonctionnalités principales

### Frontend
- Authentification (login, register, mot de passe oublié / reset).
- Gestion du profil utilisateur (photo de profil, style du dashboard).
- Tableau de bord affichant le nombre d’abonnés Instagram.
- Popup en temps réel indiquant les variations de followers.
- Consentement cookies (RGPD).
- Abonnement premium avec Stripe.
- Accessibilité (ARIA, navigation clavier, contrastes validés avec Lighthouse).
- Responsive design avec TailwindCSS.

### Backend (API REST)
- Authentification avec JWT.
- Vérification email (double opt-in).
- Routes utilisateurs :
  - `POST /api/register` → inscription
  - `POST /api/login` → connexion
  - `POST /api/forgot-password` → mot de passe oublié
  - `POST /api/reset-password/:token` → réinitialisation du mot de passe
  - `GET /api/me` → infos utilisateur
  - `PUT /api/update-username` → changer le username
  - `PUT /api/update-password` → changer le mot de passe
  - `POST /api/upload-profile-picture` → photo de profil
  - `PUT /api/update-style` → style du dashboard
  - `DELETE /api/delete-account` → suppression de compte
- Routes Instagram :
  - `POST /api/connect-instagram` → lier son compte
  - `GET /api/followers` → récupérer le nombre de followers
- Routes Stripe :
  - `POST /api/stripe/create-checkout-session` → abonnement
  - `POST /api/stripe/webhook` → suivi des paiements
- Routes Admin :
  - gestion des utilisateurs et abonnements.

### Base de données (MongoDB via Mongoose)
- Stockage des utilisateurs avec :
  - email, username, password (haché avec bcrypt).
  - rôle (user, admin, freeuser, testeur).
  - abonnement (isSubscribed).
  - essai gratuit (trialStart, trialEnds, hasUsedTrial).
  - personnalisation (photo de profil, style dashboard).
  - tokens (emailVerificationToken, resetToken).

---

## 🚀 Installation et lancement

### 1. Cloner le dépôt
```bash
git clone https://github.com/username/ig-followers-upgrade.git
cd ig-followers-upgrade
```

### 2. Variables d’environnement
Créer un fichier `.env` dans **backend/** avec :
```
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/ig-followers
JWT_SECRET=ton_secret_jwt
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ton_email
EMAIL_PASS=ton_mot_de_passe
STRIPE_SECRET_KEY=clé_stripe
STRIPE_WEBHOOK_SECRET=webhook_stripe
ADMIN_EMAIL=admin@tonsite.com
```

Dans **frontend/** créer `.env` :
```
VITE_API_URL=http://localhost:3001
```

### 3. Lancer le backend
```bash
cd backend
npm install
npm run dev
```

### 4. Lancer le frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Utilisation avec Docker

### 1. Construire et lancer
```bash
docker-compose up --build
```

### 2. Arrêter
```bash
docker-compose down
```

---

## 🧪 Tests

### Backend
Tests automatisés avec Jest + Supertest :
```bash
cd backend
npm test
```

### Frontend
Tests avec Vitest + React Testing Library :
```bash
cd frontend
npm test
```

---

## 🔐 Sécurité & RGPD
- Cookies soumis au consentement explicite.
- Double opt-in pour inscription.
- Données sensibles hachées (bcrypt).
- Tokens JWT pour protéger les routes.
- Connexions sécurisées (HTTPS).
- Politique de confidentialité intégrée.

---

## 📈 Suivi et monitoring
- Google Analytics (avec consentement).
- Google Search Console (SEO).
- Lighthouse pour accessibilité et performance.

---

## 💳 Monétisation
- Stripe pour abonnement récurrent (mensuel).
- Gestion automatique des factures.
- Annulation possible directement via Stripe ou en désactivant l’abonnement dans le dashboard.
- Perspectives futures :
  - Publicité ciblée.
  - Programme d’affiliation.

---

## 👨‍💻 Contribution
1. Fork le projet
2. Crée une branche (`git checkout -b feature/nouvelle-feature`)
3. Commit tes changements (`git commit -m 'Ajout nouvelle feature'`)
4. Push (`git push origin feature/nouvelle-feature`)
5. Ouvre une Pull Request

---

## 📄 Licence
Projet privé – Tous droits réservés.

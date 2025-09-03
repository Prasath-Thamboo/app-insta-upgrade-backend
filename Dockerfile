# backend/Dockerfile
FROM node:20-alpine

# Crée un user non-root pour de meilleures pratiques
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copie uniquement les manifests pour optimiser le cache
COPY package*.json ./

# Installe en prod (si tu as besoin de dev deps pour build, remplace par `npm ci`)
RUN npm ci --only=production

# Copie le code
COPY . .

# Donne l’accès au dossier d’upload
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app

# Variables d'env typiques (tu les passeras via .env / compose)
# ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]

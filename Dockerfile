# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Installer dépendances en mode prod
COPY package*.json ./
# Si tu utilises "npm ci" : fiable avec lockfile
RUN npm ci --omit=dev

# Copier le code
COPY . .

# ---- Run stage ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# User non-root
RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

# Copie seulement ce qu'il faut
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./

# Variables runtime optionnelles (à surcharger au `docker run`)
ENV PORT=8080
ENV NODE_OPTIONS="--enable-source-maps"

# Expose le port
EXPOSE 8080

# Healthcheck (pointe vers /health de ton API)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

USER nodeapp

# Démarrage (adapte si ton fichier d'entrée diffère)
CMD ["node", "server.js"]

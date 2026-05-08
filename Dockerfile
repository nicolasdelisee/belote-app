# ── Étape 1 : build du client ────────────────────────────────────────────────
FROM node:22-alpine AS build-client
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ .

# Ces variables sont baked dans le bundle au moment du build.
# VITE_SERVER_URL est vide intentionnellement : le client et le serveur
# partagent la même origine, donc socket.io se connecte automatiquement.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Étape 2 : build du serveur ───────────────────────────────────────────────
FROM node:22-alpine AS build-server
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ .
RUN npm run build

# ── Étape 3 : image finale ───────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY --from=build-server /app/server/dist ./dist
COPY --from=build-server /app/server/node_modules ./node_modules
COPY --from=build-server /app/server/package.json ./package.json

# Le client buildé est servi comme fichiers statiques par Express
COPY --from=build-client /app/client/dist ./public

EXPOSE 3002

CMD ["node", "dist/index.js"]

# JOYI: backend/Dockerfile  (GitHub'da shu yo'l bilan yarating)
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
CMD ["sh","-c","node src/migrate.js && node src/server.js"]

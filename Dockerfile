# JOYI: Dockerfile  (reponing eng tashqi papkasida, backend/ va frontend/ bilan yonma-yon)
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/src ./src
COPY backend/data ./data
COPY --from=web /web/dist ./public
CMD ["sh","-c","node src/migrate.js && node src/server.js"]

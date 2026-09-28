FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --legacy-peer-deps

COPY server.js .
COPY database ./database

EXPOSE 4000

CMD ["node", "server.js"]
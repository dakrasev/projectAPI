FROM node:18-alpine

LABEL authors="mac"

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
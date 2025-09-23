FROM node:20-alpine AS builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm install

COPY client ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

COPY --from=builder /app/client/dist ./dist

EXPOSE 3000

CMD ["node", "index.js"]
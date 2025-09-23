FROM node:20-alpine AS builder

WORKDIR /app/client

COPY server/client/package.json server/client/package-lock.json ./

RUN npm install

COPY server/client ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

COPY --from=builder /app/client/dist ./dist

EXPOSE 3000

CMD ["node", "index.js"]
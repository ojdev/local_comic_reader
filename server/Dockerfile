FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

# Builder stage for client
WORKDIR /app/server/client

RUN npm install
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY . .

# Runner stage for server
WORKDIR /app/server

RUN npm install --production

COPY --from=builder /app/server/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "index.js"]
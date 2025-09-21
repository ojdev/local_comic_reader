FROM node:18-alpine AS builder
ENV COMIC_BASE_PATH=/app/comics
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm install
COPY . .
ENV VITE_LOG_LEVEL=info
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
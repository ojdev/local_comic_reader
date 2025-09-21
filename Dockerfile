FROM node:20-alpine as builder
ENV COMIC_BASE_PATH=/app/comics
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm install
RUN npm install -g vite
COPY . .
ENV VITE_LOG_LEVEL=info
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
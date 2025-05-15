FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

WORKDIR /app/client
RUN npm install --legacy-peer-deps

WORKDIR /app/server
RUN npm install

WORKDIR /app/client
RUN npm run build

FROM nginx:alpine AS production

COPY ./client/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80
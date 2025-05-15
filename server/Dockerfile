FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

WORKDIR /app/server
RUN npm install

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app/server

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/node_modules ./node_modules

CMD ["node", "dist/index.js"]
FROM node:lts-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:lts-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN groupadd -g 1001 nodejs && \
  useradd -u 1001 -g nodejs -s /bin/bash -m nodejs && \
  chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "dist/index.js"]
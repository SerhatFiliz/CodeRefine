# code-refine-frontend-main/Dockerfile

# 1. Aşama: Bağımlılıklar
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Aşama: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Aşama: Üretim
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 'output: standalone' sayesinde
# sadece gerekli dosyalar buraya kopyalanacak.
# COPY --from=builder /app/public ./public  <-- BU SATIRI SİLDİK
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Standalone modda 'server.js' dosyasını çalıştırır
CMD ["node", "server.js"]
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo dev para build)
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Instalar tsx localmente para executar código ESM compilado
RUN npm install tsx --save-prod

# Copiar Prisma schema e migrations
COPY prisma ./prisma/

# Gerar Prisma Client na imagem de produção
RUN npx prisma generate

# Copiar build e node_modules do Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Criar diretório para uploads
RUN mkdir -p uploads

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Mudar ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
# Usa tsx via npx para executar o código compilado (necessário para ESM)
CMD ["npx", "tsx", "dist/server.js"]


# 🚀 Guia Prático: Versionamento e Configurações Pré-Produção

Este guia fornece um passo a passo completo para preparar o projeto ChurchPulse para versionamento (Git) e configurações pré-produção.

---

## 📋 Checklist: O que falta no projeto

### ✅ Já implementado
- [x] Estrutura de pastas organizada
- [x] Documentação básica (README.md)
- [x] `.gitignore` em cada subprojeto (backend, mobile, web)
- [x] Configuração de ambientes (dev, test, production)
- [x] Scripts de build e testes
- [x] Docker Compose para PostgreSQL

### ❌ O que precisa ser criado/configurado

#### 1. Versionamento (Git)
- [ ] `.gitignore` na raiz do projeto
- [ ] Repositório Git inicializado
- [ ] Arquivos `.env.example` para cada subprojeto
- [ ] `.gitattributes` (opcional, mas recomendado)
- [ ] Configuração de branch protection (no GitHub/GitLab)

#### 2. Configurações de Ambiente
- [ ] `.env.example` no backend
- [ ] `.env.example` no mobile
- [ ] `.env.example` no web
- [ ] `.env.production.example` no backend
- [ ] Documentação de variáveis de ambiente

#### 3. Pré-Produção
- [ ] Configuração de variáveis de ambiente de produção
- [ ] Scripts de deploy
- [ ] Configuração de CI/CD básico (GitHub Actions / GitLab CI)
- [ ] Dockerfile para backend
- [ ] Dockerfile para web
- [ ] docker-compose.production.yml
- [ ] Configuração de banco de dados de produção
- [ ] Configuração de gateway de pagamento para produção
- [ ] Configuração de domínio e SSL

#### 4. Segurança
- [ ] Revisão de secrets e tokens
- [ ] Configuração de secrets no repositório (GitHub Secrets / GitLab Variables)
- [ ] Validação de variáveis de ambiente obrigatórias
- [ ] Configuração de CORS para produção

#### 5. Monitoramento e Logs
- [ ] Configuração de logging estruturado
- [ ] Integração com serviço de monitoramento (opcional)
- [ ] Health check endpoints

---

## 🔧 Passo 1: Configurar Git e Versionamento

### 1.1 Criar `.gitignore` na raiz

Crie um arquivo `.gitignore` na raiz do projeto com o seguinte conteúdo:

```gitignore
# Dependências
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Arquivos de ambiente
.env
.env.local
.env.*.local
.env.production
.env.test
*.env

# Build outputs
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Sistema operacional
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/

# Expo
.expo/
.expo-shared/
web-build/
.expo/

# Uploads e arquivos temporários
uploads/
temp/
tmp/
*.tmp

# Testes
coverage/
.nyc_output/
*.lcov

# Prisma
*.db
*.db-journal

# Docker
.dockerignore

# Misc
*.pem
*.key
*.cert
*.crt
```

### 1.2 Inicializar repositório Git

```bash
# Na raiz do projeto
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "feat: initial commit - ChurchPulse project structure"

# Criar branch main (se ainda não existir)
git branch -M main

# Adicionar remote (substitua pela URL do seu repositório)
git remote add origin https://github.com/seu-usuario/churchappcomplete.git

# Push inicial
git push -u origin main
```

### 1.3 Criar `.gitattributes` (opcional, mas recomendado)

Crie um arquivo `.gitattributes` na raiz:

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# Source code
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# Scripts
*.sh text eol=lf
*.ps1 text eol=crlf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
```

---

## 🔐 Passo 2: Criar arquivos `.env.example`

### 2.1 Backend - `.env.example`

Crie `backend/.env.example`:

```env
# Ambiente
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churchapp?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Payment Gateway
PAYMENT_GATEWAY=mercadopago

# MercadoPago (Sandbox)
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-mercadopago-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-mercadopago-webhook-secret"
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_BACK_URL="http://localhost:5173/subscription/success"
MERCADOPAGO_WEBHOOK_URL="http://localhost:3333/api/payments/webhook"

# Server
PORT=3333
```

### 2.2 Backend - `.env.production.example`

Crie `backend/.env.production.example`:

```env
# Ambiente
NODE_ENV=production

# Database (use uma URL de produção segura)
DATABASE_URL="postgresql://user:password@production-host:5432/churchapp_prod?schema=public&sslmode=require"

# JWT (use um secret forte e único)
JWT_SECRET="generate-a-strong-random-secret-here"

# Payment Gateway
PAYMENT_GATEWAY=mercadopago

# MercadoPago (Production)
MERCADOPAGO_ACCESS_TOKEN="your-production-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-production-mercadopago-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-production-mercadopago-webhook-secret"
MERCADOPAGO_ENVIRONMENT=production
MERCADOPAGO_BACK_URL="https://yourdomain.com/subscription/success"
MERCADOPAGO_WEBHOOK_URL="https://api.yourdomain.com/api/payments/webhook"

# Server
PORT=3333
```

### 2.3 Mobile - `.env.example`

Crie `mobile/.env.example`:

```env
# API URL
EXPO_PUBLIC_API_URL=http://localhost:3333
```

### 2.4 Web - `.env.example`

Crie `web/.env.example`:

```env
# API URL
VITE_API_URL=http://localhost:3333
```

### 2.5 Web - `.env.production.example`

Crie `web/.env.production.example`:

```env
# API URL (produção)
VITE_API_URL=https://api.yourdomain.com
```

---

## 🏗️ Passo 3: Configurações Pré-Produção

### 3.1 Criar Dockerfile para Backend

Crie `backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar build e prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

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
CMD ["npm", "start"]
```

### 3.2 Criar Dockerfile para Web

Crie `web/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build para produção
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Criar `web/nginx.conf`

Crie `web/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.4 Criar `docker-compose.production.yml`

Crie `docker-compose.production.yml` na raiz:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: churchapp-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-churchapp}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - churchapp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: churchapp-backend-prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      PAYMENT_GATEWAY: ${PAYMENT_GATEWAY:-mercadopago}
      MERCADOPAGO_ACCESS_TOKEN: ${MERCADOPAGO_ACCESS_TOKEN}
      MERCADOPAGO_PUBLIC_KEY: ${MERCADOPAGO_PUBLIC_KEY}
      MERCADOPAGO_WEBHOOK_SECRET: ${MERCADOPAGO_WEBHOOK_SECRET}
      MERCADOPAGO_ENVIRONMENT: ${MERCADOPAGO_ENVIRONMENT:-production}
      MERCADOPAGO_BACK_URL: ${MERCADOPAGO_BACK_URL}
      MERCADOPAGO_WEBHOOK_URL: ${MERCADOPAGO_WEBHOOK_URL}
      PORT: 3333
    ports:
      - "3333:3333"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - churchapp-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: churchapp-web-prod
    restart: always
    environment:
      VITE_API_URL: ${VITE_API_URL}
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - churchapp-network

volumes:
  postgres_data:

networks:
  churchapp-network:
    driver: bridge
```

### 3.5 Adicionar Health Check no Backend

Adicione uma rota de health check em `backend/src/routes/health.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    try {
      // Verificar conexão com banco
      await prisma.$queryRaw`SELECT 1`
      
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      })
    } catch (error) {
      return reply.status(503).send({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      })
    }
  })
}

E registre a rota em `backend/src/app.ts`:

```typescript
// ... existing code ...
import { healthRoutes } from './routes/health'

// ... existing code ...

app.register(healthRoutes)
```

---

## 🔄 Passo 4: Configurar CI/CD Básico

### 4.1 GitHub Actions

Crie `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: churchapp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Setup database
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/churchapp_test
        run: |
          npx prisma migrate deploy
          npm run seed:test
      
      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/churchapp_test
          JWT_SECRET: test-secret
        run: npm test

  web-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      
      - name: Install dependencies
        working-directory: ./web
        run: npm ci
      
      - name: Run tests
        working-directory: ./web
        run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [backend-test, web-test]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build backend
        working-directory: ./backend
        run: |
          npm ci
          npm run build
      
      - name: Build web
        working-directory: ./web
        run: |
          npm ci
          npm run build
```

### 4.2 GitLab CI (alternativa)

Crie `.gitlab-ci.yml` na raiz:

```yaml
stages:
  - test
  - build

variables:
  NODE_VERSION: "18"

backend:test:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:15
  variables:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: churchapp_test
    DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/churchapp_test"
  before_script:
    - cd backend
    - npm ci
    - npx prisma migrate deploy
    - npm run seed:test
  script:
    - npm test
  only:
    - main
    - develop
    - merge_requests

web:test:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - cd web
    - npm ci
  script:
    - npm test
  only:
    - main
    - develop
    - merge_requests

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - cd backend && npm ci && npm run build
    - cd ../web && npm ci && npm run build
  artifacts:
    paths:
      - backend/dist/
      - web/dist/
    expire_in: 1 week
  only:
    - main
```

---

## 📝 Passo 5: Scripts de Deploy

### 5.1 Script de Deploy - Backend

Crie `backend/scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Iniciando deploy do backend..."

# Verificar variáveis de ambiente
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não configurada"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET não configurada"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Executar migrações
echo "🗄️ Executando migrações..."
npx prisma migrate deploy

# Build
echo "🔨 Fazendo build..."
npm run build

# Iniciar servidor
echo "✅ Deploy concluído!"
npm start
```

### 5.2 Script de Deploy - Web

Crie `web/scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Iniciando deploy do web..."

# Verificar variáveis de ambiente
if [ -z "$VITE_API_URL" ]; then
  echo "❌ VITE_API_URL não configurada"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build
echo "🔨 Fazendo build..."
npm run build

echo "✅ Build concluído! Arquivos em ./dist"
```

---

## 🔒 Passo 6: Configurar Secrets no Repositório

### 6.1 GitHub Secrets

1. Vá em Settings > Secrets and variables > Actions
2. Adicione os seguintes secrets:
   - `DATABASE_URL_PROD`
   - `JWT_SECRET_PROD`
   - `MERCADOPAGO_ACCESS_TOKEN_PROD`
   - `MERCADOPAGO_PUBLIC_KEY_PROD`
   - `MERCADOPAGO_WEBHOOK_SECRET_PROD`

### 6.2 GitLab Variables

1. Vá em Settings > CI/CD > Variables
2. Adicione as mesmas variáveis marcadas como "Protected" e "Masked"

---

## 📋 Passo 7: Checklist Final Pré-Produção

### Segurança
- [ ] Todas as senhas e secrets estão em variáveis de ambiente
- [ ] Nenhum secret está commitado no código
- [ ] `.env` está no `.gitignore`
- [ ] CORS configurado corretamente para produção
- [ ] SSL/HTTPS configurado
- [ ] JWT_SECRET é forte e único

### Banco de Dados
- [ ] Banco de produção criado
- [ ] Migrações testadas em ambiente de staging
- [ ] Backup automático configurado
- [ ] Conexão SSL habilitada (se aplicável)

### Gateway de Pagamento
- [ ] Credenciais de produção configuradas
- [ ] Webhook URL configurada corretamente
- [ ] Ambiente de produção ativado (não sandbox)
- [ ] Testes de pagamento realizados

### Infraestrutura
- [ ] Domínio configurado
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Monitoramento configurado
- [ ] Logs configurados

### Aplicação
- [ ] Build de produção testado
- [ ] Health checks funcionando
- [ ] Testes passando
- [ ] Performance testada

---

## 🚀 Próximos Passos

1. **Execute o checklist acima** - Marque cada item conforme for completando
2. **Configure o repositório Git** - Siga o Passo 1
3. **Crie os arquivos `.env.example`** - Siga o Passo 2
4. **Configure Docker** - Siga o Passo 3
5. **Configure CI/CD** - Siga o Passo 4
6. **Teste em ambiente de staging** - Antes de ir para produção
7. **Configure monitoramento** - Para acompanhar a aplicação em produção

---

## 📚 Documentação Adicional

- [Configuração de Ambiente](./CONFIGURACAO_AMBIENTE.md)
- [Guia de Gateway de Pagamento](./GUIA_PRATICO_GATEWAY_PAGAMENTO.md)
- [Documentação do Backend](./backend/README.md)
- [Documentação do Mobile](./mobile/README.md)
- [Documentação do Web](./web/README.md)

---

**Última Atualização**: Janeiro 2025
**Versão**: 1.0.0
```

Este guia cobre:

1. Checklist do que falta
2. Configuração do Git e versionamento
3. Arquivos `.env.example` para cada subprojeto
4. Dockerfiles e docker-compose para produção
5. CI/CD básico (GitHub Actions e GitLab CI)
6. Scripts de deploy
7. Configuração de secrets
8. Checklist final pré-produção

Quer que eu crie algum desses arquivos agora ou prefere revisar o guia primeiro?


# 🚀 Guia de Deploy no Render

Este guia explica como fazer deploy do projeto no Render usando o arquivo `render.yaml`.

## 📋 Pré-requisitos

1. Conta no Render (https://render.com)
2. Repositório Git conectado (GitHub, GitLab, etc.)
3. Banco de dados PostgreSQL (Supabase, Railway, ou Render PostgreSQL)

## 🔧 Passo a Passo

### 1. Configurar o Blueprint no Render

1. Acesse o [Render Dashboard](https://dashboard.render.com)
2. Clique em **New** → **Blueprint**
3. Conecte seu repositório Git
4. O Render detectará automaticamente o arquivo `render.yaml` na raiz do projeto
5. Clique em **Apply**

### 2. Configurar Variáveis de Ambiente

Após o primeiro deploy, você precisa configurar manualmente as variáveis de ambiente sensíveis no Render Dashboard:

#### Backend Service (`churchapp-backend-dev`)

1. Vá em **Dashboard** → **churchapp-backend-dev** → **Environment**
2. Adicione as seguintes variáveis:

**Obrigatórias:**
```
DATABASE_URL=postgresql://usuario:senha@host:porta/nome_banco?schema=public
JWT_SECRET=sua-chave-secreta-jwt-aqui
CORS_ORIGINS=https://churchapp-web-dev.onrender.com,http://localhost:3000
```

**MercadoPago (se usar):**
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
MERCADOPAGO_BACK_URL=https://churchapp-web-dev.onrender.com/subscription/success
MERCADOPAGO_WEBHOOK_URL=https://churchapp-backend-dev.onrender.com/api/webhooks/payment/mercadopago
```

**Email SMTP (opcional):**
```
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

#### Frontend Service (`churchapp-web-dev`)

1. Vá em **Dashboard** → **churchapp-web-dev** → **Environment**
2. Adicione:

```
VITE_API_URL=https://churchapp-backend-dev.onrender.com
```

**⚠️ Importante:** Substitua `churchapp-backend-dev.onrender.com` e `churchapp-web-dev.onrender.com` pelas URLs reais dos seus serviços no Render.

### 3. Executar Migrations e Seed

Após o primeiro deploy do backend, você precisa executar as migrations e o seed:

1. No Render Dashboard, vá em **churchapp-backend-dev**
2. Vá em **Shell** (ou use SSH)
3. Execute:

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

### 4. Verificar o Deploy

- **Backend:** Acesse `https://churchapp-backend-dev.onrender.com/health`
- **Frontend:** Acesse `https://churchapp-web-dev.onrender.com`
- **API Docs:** Acesse `https://churchapp-backend-dev.onrender.com/docs`

## 🔄 Atualizações Automáticas

O Render fará deploy automático sempre que você fizer push para a branch `main` (ou a branch configurada).

## 📝 Notas Importantes

1. **Root Directory:** O `render.yaml` já está configurado com `rootDir: backend` e `rootDir: web` respectivamente
2. **Build Command:** O backend compila TypeScript e gera o Prisma Client antes de iniciar
3. **Health Check:** O backend tem um endpoint `/health` para verificação de saúde
4. **CORS:** Certifique-se de adicionar a URL do frontend em `CORS_ORIGINS`
5. **Webhooks:** Após o deploy, atualize a URL do webhook no painel do MercadoPago

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se o `buildCommand` está executando `npx prisma generate`
- Verifique se todas as dependências estão no `package.json`

### Erro: "DATABASE_URL not found"
- Certifique-se de que a variável `DATABASE_URL` está configurada no Render Dashboard
- Verifique se a URL está correta e acessível

### Erro: "Migration failed"
- Execute `npx prisma migrate deploy` manualmente via Shell no Render
- Verifique se o banco de dados está acessível

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está configurada corretamente
- Verifique se `CORS_ORIGINS` inclui a URL do frontend
- Verifique os logs do backend para erros de CORS

## 🔐 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Use variáveis de ambiente do Render para dados sensíveis
- Use `sync: false` no `render.yaml` para variáveis sensíveis
- Rotacione tokens e senhas periodicamente

## 📚 Referências

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Prisma Deploy Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)


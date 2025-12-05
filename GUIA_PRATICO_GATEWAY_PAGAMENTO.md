# 🚀 Guia Prático: Conexão com Gateway de Pagamento

Este guia passo a passo te ajudará a configurar e conectar o sistema com o MercadoPago para processar assinaturas recorrentes.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Criar Conta no MercadoPago](#passo-1-criar-conta-no-mercadopago)
3. [Passo 2: Criar Aplicação no MercadoPago](#passo-2-criar-aplicação-no-mercadopago)
4. [Passo 3: Obter Credenciais](#passo-3-obter-credenciais)
5. [Passo 4: Configurar Variáveis de Ambiente](#passo-4-configurar-variáveis-de-ambiente)
6. [Passo 5: Configurar Webhooks](#passo-5-configurar-webhooks)
7. [Passo 6: Testar a Conexão](#passo-6-testar-a-conexão)
8. [Passo 7: Migrar para Produção](#passo-7-migrar-para-produção)
9. [Troubleshooting](#troubleshooting)
10. [Checklist Final](#checklist-final)

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no MercadoPago (pessoal ou empresarial)
- ✅ Acesso ao painel de desenvolvedores do MercadoPago
- ✅ Servidor backend rodando e acessível
- ✅ URL pública para receber webhooks (use ngrok para desenvolvimento local)
- ✅ Banco de dados configurado e migrations executadas

---

## Passo 1: Criar Conta no MercadoPago

### 1.1 Acesse o MercadoPago

1. Vá para: https://www.mercadopago.com.br/
2. Clique em **"Criar conta"** ou **"Entrar"** se já tiver conta
3. Complete o cadastro com seus dados

### 1.2 Verificar Conta

- Para usar em produção, você precisará verificar sua conta
- Durante desenvolvimento, use o ambiente **Sandbox** (testes)

---

## Passo 2: Criar Aplicação no MercadoPago

### 2.1 Acessar Painel de Desenvolvedores

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login com sua conta
3. Clique em **"Suas integrações"** ou **"Aplicações"**

### 2.2 Criar Nova Aplicação

1. Clique em **"Criar aplicação"** ou **"Nova aplicação"**
2. Preencha os dados:
   - **Nome da aplicação**: Ex: "ChurchApp - Sistema de Gestão"
   - **Descrição**: Breve descrição do que sua aplicação faz
   - **Plataforma**: Web
   - **URL do site**: URL do seu site (pode ser temporária)

3. Clique em **"Criar"**

### 2.3 Anotar o Application ID

- Após criar, você verá um **Application ID**
- Anote este ID (será útil depois)

---

## Passo 3: Obter Credenciais

### 3.1 Credenciais de Teste (Sandbox)

**IMPORTANTE**: Use sempre credenciais de teste durante desenvolvimento!

1. No painel da aplicação, vá para a aba **"Credenciais de teste"**
2. Você verá:
   - **Public Key** (chave pública)
   - **Access Token** (token de acesso)

3. **Copie ambos** e guarde em local seguro

**Exemplo de credenciais de teste:**
```
Public Key: TEST-12345678-1234-1234-1234-123456789012-123456-12345678901234567890123456789012-123456789
Access Token: TEST-1234567890123456-123456-abcdefghijklmnopqrstuvwxyz-123456789
```

### 3.2 Credenciais de Produção

⚠️ **ATENÇÃO**: Só use credenciais de produção quando estiver pronto para receber pagamentos reais!

1. No painel da aplicação, vá para a aba **"Credenciais de produção"**
2. Você precisará:
   - Verificar sua conta
   - Completar dados fiscais
   - Aprovar a aplicação

3. Após aprovação, copie as credenciais de produção

---

## Passo 4: Configurar Variáveis de Ambiente

### 4.1 Arquivos de Ambiente Disponíveis

O projeto suporta múltiplos arquivos de ambiente:

- **`.env`** → Desenvolvimento local (padrão)
- **`.env.test`** → Testes automatizados
- **`.env.production`** → Produção (NÃO commitar no repositório)

### 4.2 Criar Arquivo .env

No diretório `backend/`, copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env
```

Ou crie manualmente o arquivo `.env` e adicione as variáveis:

### 4.3 Adicionar Variáveis

Adicione as seguintes variáveis ao seu `.env`:

```env
# ============================================
# GATEWAY DE PAGAMENTO
# ============================================

# Gateway a ser usado (mercadopago, asaas, pagseguro, stripe)
PAYMENT_GATEWAY=mercadopago

# ============================================
# MERCADOPAGO - CREDENCIAIS
# ============================================

# Access Token (obtido no painel do MercadoPago)
MERCADOPAGO_ACCESS_TOKEN=TEST-SEU_ACCESS_TOKEN_AQUI

# Public Key (obtido no painel do MercadoPago)
MERCADOPAGO_PUBLIC_KEY=TEST-SUA_PUBLIC_KEY_AQUI

# Webhook Secret (será configurado no passo 5)
MERCADOPAGO_WEBHOOK_SECRET=

# Ambiente (sandbox para testes, production para produção)
MERCADOPAGO_ENVIRONMENT=sandbox

# URL de retorno após pagamento (frontend)
MERCADOPAGO_BACK_URL=http://localhost:5173/subscription/success

# URL do webhook (backend) - use ngrok para desenvolvimento local
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/payment/mercadopago
```

### 4.3 Substituir Valores

Substitua:
- `SEU_ACCESS_TOKEN_AQUI` → Seu Access Token do MercadoPago
- `SUA_PUBLIC_KEY_AQUI` → Sua Public Key do MercadoPago
- `http://localhost:5173` → URL do seu frontend (ajuste a porta se necessário)
- `https://seu-dominio.com` → URL pública do seu backend (use ngrok para local)

### 4.4 Exemplo Completo de .env (Desenvolvimento)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/churchapp

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Gateway de Pagamento
PAYMENT_GATEWAY=mercadopago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789012-123456-12345678901234567890123456789012-123456789
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_BACK_URL=http://localhost:5173/subscription/success
MERCADOPAGO_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/payment/mercadopago
```

### 4.5 Criar .env.test (Para Testes Automatizados)

Se você vai rodar testes automatizados, crie também `.env.test`:

```bash
cd backend
cp .env.example .env.test
```

E ajuste as variáveis para testes:
- Use as mesmas credenciais de teste do MercadoPago
- `MERCADOPAGO_ENVIRONMENT=sandbox`
- `MERCADOPAGO_WEBHOOK_URL` pode ser localhost para testes

### 4.6 Scripts Disponíveis

O projeto tem scripts para diferentes ambientes:

```bash
# Desenvolvimento (usa .env)
npm run dev

# Desenvolvimento com .env.test
npm run dev:test

# Desenvolvimento com .env.production (cuidado!)
npm run dev:prod

# Produção (usa .env.production)
npm run start:prod
```

⚠️ **ATENÇÃO**: Use `npm run dev:prod` apenas quando estiver testando configurações de produção localmente. Nunca use credenciais de produção em desenvolvimento!

---

## Passo 5: Configurar Webhooks

### 5.1 Expor Backend Localmente (Desenvolvimento)

Para desenvolvimento local, você precisa expor seu backend para receber webhooks.

#### Opção A: Usar ngrok (Recomendado)

1. **Instalar ngrok:**
   ```bash
   # Windows (com Chocolatey)
   choco install ngrok
   
   # Ou baixe de: https://ngrok.com/download
   ```

2. **Iniciar ngrok:**
   ```bash
   ngrok http 3333
   ```
   (Substitua 3333 pela porta do seu backend)

3. **Copiar a URL HTTPS:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3333
   ```
   Use esta URL no `MERCADOPAGO_WEBHOOK_URL`

#### Opção B: Usar Servidor em Produção

Se já tiver servidor em produção, use a URL diretamente:
```
MERCADOPAGO_WEBHOOK_URL=https://api.seudominio.com/api/webhooks/payment/mercadopago
```

### 5.2 Configurar Webhook no MercadoPago

1. **Acesse o painel da aplicação:**
   - Vá para: https://www.mercadopago.com.br/developers/panel/app
   - Selecione sua aplicação

2. **Ir para Webhooks:**
   - No menu lateral, clique em **"Webhooks"**
   - Ou acesse diretamente: https://www.mercadopago.com.br/developers/panel/app/{APPLICATION_ID}/webhooks

3. **Adicionar Webhook:**
   - Clique em **"Adicionar webhook"** ou **"Criar webhook"**
   - **URL**: Cole a URL do seu backend:
     ```
     https://abc123.ngrok.io/api/webhooks/payment/mercadopago
     ```
   - **Eventos a escutar**: Selecione:
     - ✅ `payment` (pagamentos)
     - ✅ `preapproval` (assinaturas recorrentes)
     - ✅ `authorized_payment` (pagamentos autorizados)

4. **Salvar e copiar Webhook Secret:**
   - Após salvar, o MercadoPago gerará um **Webhook Secret**
   - **Copie este secret** e adicione no `.env`:
     ```env
     MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
     ```

### 5.3 Verificar Webhook

1. No painel do MercadoPago, você pode testar o webhook
2. Clique em **"Testar webhook"** ou **"Enviar evento de teste"**
3. Verifique os logs do seu backend para confirmar recebimento

---

## Passo 6: Testar a Conexão

### 6.1 Verificar Configuração

1. **Reiniciar o backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verificar logs:**
   - O backend deve iniciar sem erros
   - Se houver erro de conexão com MercadoPago, verifique o Access Token

### 6.2 Testar Criação de Plano

1. **Acesse o web-admin:**
   ```
   http://localhost:5174/admin
   ```

2. **Criar um plano:**
   - Vá em "Planos" → "Novo Plano"
   - Preencha os dados:
     - Nome: "Plano Teste"
     - Preço: 29.90
     - Intervalo: Mensal
     - Features: Selecione algumas
   - Clique em "Criar Plano"

3. **Verificar sincronização:**
   - O plano deve ser sincronizado automaticamente com o MercadoPago
   - Na lista de planos, verifique a coluna "Sincronização"
   - Deve mostrar "Sincronizado" ✅

### 6.3 Testar Checkout

1. **Acesse o web app:**
   ```
   http://localhost:5173
   ```

2. **Fazer login** com um usuário de teste

3. **Abrir modal de planos:**
   - Quando o limite de membros for atingido, o modal aparece automaticamente
   - Ou acesse diretamente a página de planos

4. **Selecionar um plano:**
   - Clique em "Escolher Plano"
   - Você será redirecionado para o checkout do MercadoPago

5. **Usar cartão de teste:**
   - No checkout do MercadoPago, use um cartão de teste:
     ```
     Número: 5031 4332 1540 6351
     CVV: 123
     Nome: APRO
     Validade: 11/25
     ```
   - Ou use outros cartões de teste do MercadoPago

6. **Completar pagamento:**
   - Após pagamento, você será redirecionado para `/subscription/success`
   - Verifique se a assinatura foi criada

### 6.4 Verificar Webhook

1. **Verificar logs do backend:**
   - Após o pagamento, o MercadoPago enviará um webhook
   - Verifique os logs para confirmar recebimento

2. **Verificar no banco de dados:**
   ```sql
   -- Verificar assinatura criada
   SELECT * FROM "Subscription" ORDER BY "createdAt" DESC LIMIT 1;
   
   -- Verificar webhook recebido
   SELECT * FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 5;
   
   -- Verificar pagamento
   SELECT * FROM "PaymentHistory" ORDER BY "createdAt" DESC LIMIT 5;
   ```

3. **Verificar no admin:**
   - Acesse "Assinaturas" no web-admin
   - Deve aparecer a nova assinatura com status "active"

---

## Passo 7: Migrar para Produção

### 7.1 Verificar Conta

1. Certifique-se de que sua conta do MercadoPago está verificada
2. Complete todos os dados fiscais necessários
3. Aprove a aplicação para produção

### 7.2 Obter Credenciais de Produção

1. No painel da aplicação, vá para **"Credenciais de produção"**
2. Copie o **Access Token** e **Public Key** de produção
3. **NÃO use credenciais de teste em produção!**

### 7.3 Criar .env.production

No servidor de produção, crie um arquivo `.env.production` separado:

```bash
cd backend
cp .env.example .env.production
```

⚠️ **IMPORTANTE**: 
- O arquivo `.env.production` NÃO deve ser commitado no repositório
- Adicione `.env.production` ao `.gitignore`
- Use variáveis de ambiente do servidor ou um gerenciador de secrets

### 7.4 Atualizar Variáveis de Ambiente

No arquivo `.env.production`, atualize com as credenciais de produção:

```env
# Ambiente de produção
MERCADOPAGO_ENVIRONMENT=production

# Credenciais de produção
MERCADOPAGO_ACCESS_TOKEN=APP_USR-PROD-1234567890123456-123456-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-PROD-12345678-1234-1234-1234-123456789012-123456-12345678901234567890123456789012-123456789

# URLs de produção
MERCADOPAGO_BACK_URL=https://seudominio.com/subscription/success
MERCADOPAGO_WEBHOOK_URL=https://api.seudominio.com/api/webhooks/payment/mercadopago
```

### 7.5 Iniciar Servidor em Produção

Use o script específico para produção:

```bash
npm run start:prod
```

Este script carregará automaticamente o `.env.production`.

### 7.6 Atualizar Webhook

1. No painel do MercadoPago, atualize a URL do webhook para produção
2. Use HTTPS obrigatoriamente
3. Teste o webhook após atualizar

### 7.7 Testar em Produção

1. Crie um plano de teste com valor baixo (R$ 0,01)
2. Faça um pagamento real de teste
3. Verifique se tudo funciona corretamente
4. Após confirmar, crie os planos reais

---

## Troubleshooting

### ❌ Erro: "MercadoPago accessToken é obrigatório"

**Causa**: Access Token não configurado ou inválido

**Solução**:
1. Verifique se `MERCADOPAGO_ACCESS_TOKEN` está no `.env`
2. Verifique se não há espaços extras no token
3. Certifique-se de estar usando o token correto (teste vs produção)
4. Reinicie o backend após alterar o `.env`

### ❌ Erro: "Plano não está sincronizado com gateway"

**Causa**: Plano criado antes da configuração do gateway ou erro na sincronização

**Solução**:
1. Verifique os logs do backend ao criar o plano
2. Verifique se o Access Token está correto
3. Tente atualizar o plano no admin (isso força nova sincronização)
4. Verifique a coluna "Sincronização" na lista de planos

### ❌ Webhook não está sendo recebido

**Causa**: URL do webhook inacessível ou incorreta

**Solução**:
1. Verifique se o ngrok está rodando (desenvolvimento)
2. Verifique se a URL no MercadoPago está correta
3. Teste a URL manualmente:
   ```bash
   curl -X POST https://sua-url.com/api/webhooks/payment/mercadopago \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
4. Verifique os logs do backend para erros
5. Verifique se o firewall não está bloqueando

### ❌ Erro: "Assinatura inválida" no webhook

**Causa**: Webhook Secret não configurado ou incorreto

**Solução**:
1. Verifique se `MERCADOPAGO_WEBHOOK_SECRET` está no `.env`
2. Copie o secret novamente do painel do MercadoPago
3. Reinicie o backend após atualizar

### ❌ Checkout não redireciona

**Causa**: `checkoutUrl` não retornado pelo gateway

**Solução**:
1. Verifique os logs do backend ao criar checkout
2. Verifique se o plano está sincronizado
3. Verifique se o Access Token tem permissões corretas
4. Teste criar uma assinatura diretamente no painel do MercadoPago

### ❌ Pagamento aprovado mas assinatura não atualiza

**Causa**: Webhook não processado corretamente

**Solução**:
1. Verifique a tabela `WebhookEvent` no banco:
   ```sql
   SELECT * FROM "WebhookEvent" 
   WHERE "processed" = false 
   ORDER BY "createdAt" DESC;
   ```
2. Verifique os logs de erro do backend
3. Verifique se o webhook está configurado corretamente
4. Tente reprocessar manualmente se necessário

### ❌ Erro de timeout ao criar assinatura

**Causa**: MercadoPago demorando para responder

**Solução**:
1. Verifique sua conexão com a internet
2. Verifique se o MercadoPago está online
3. Aumente o timeout no código se necessário
4. Tente novamente após alguns segundos

---

## Checklist Final

Antes de considerar a integração completa, verifique:

### Configuração Básica
- [ ] Conta no MercadoPago criada
- [ ] Aplicação criada no painel de desenvolvedores
- [ ] Credenciais de teste obtidas
- [ ] Variáveis de ambiente configuradas
- [ ] Backend reiniciado após configurar .env

### Webhooks
- [ ] URL do webhook configurada no MercadoPago
- [ ] Eventos selecionados (payment, preapproval, authorized_payment)
- [ ] Webhook Secret copiado e adicionado ao .env
- [ ] Webhook testado e funcionando

### Testes
- [ ] Plano criado e sincronizado com sucesso
- [ ] Checkout funcionando e redirecionando
- [ ] Pagamento de teste realizado com sucesso
- [ ] Webhook recebido e processado
- [ ] Assinatura criada no banco de dados
- [ ] Status da assinatura atualizado corretamente

### Produção (quando pronto)
- [ ] Conta verificada no MercadoPago
- [ ] Credenciais de produção obtidas
- [ ] Variáveis de ambiente atualizadas para produção
- [ ] Webhook atualizado para URL de produção
- [ ] HTTPS configurado (obrigatório)
- [ ] Teste de pagamento real realizado

---

## 📚 Recursos Adicionais

### Documentação Oficial
- **MercadoPago Developers**: https://www.mercadopago.com.br/developers/pt/docs
- **API de Assinaturas**: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview
- **Webhooks**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

### Cartões de Teste
- **MercadoPago Test Cards**: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

### Ferramentas Úteis
- **ngrok**: https://ngrok.com/ (para expor backend local)
- **Postman**: Para testar APIs manualmente
- **MercadoPago Dashboard**: Para monitorar pagamentos

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs do backend** - Sempre o primeiro passo
2. **Consulte a documentação do MercadoPago** - Muito completa
3. **Verifique o AuditLog** - Todas as ações são registradas
4. **Teste com cartões de teste** - Evite usar cartões reais em desenvolvimento

---

## ✅ Próximos Passos

Após configurar a conexão:

1. **Criar planos reais** no admin
2. **Configurar notificações por email** quando status mudar
3. **Monitorar pagamentos** no dashboard do MercadoPago
4. **Configurar relatórios** de receita
5. **Implementar upgrade/downgrade** de planos

---

## 📝 Notas Importantes

### Segurança
- ⚠️ **NUNCA** commite o arquivo `.env` no repositório
- ⚠️ Use credenciais diferentes para desenvolvimento e produção
- ⚠️ Rotacione os tokens periodicamente
- ⚠️ Use HTTPS obrigatoriamente em produção

### Desenvolvimento
- Use sempre ambiente `sandbox` durante desenvolvimento
- Teste com cartões de teste fornecidos pelo MercadoPago
- Use ngrok para expor backend local
- Monitore os logs constantemente

### Produção
- Verifique sua conta antes de ir para produção
- Complete todos os dados fiscais
- Teste com valores baixos primeiro
- Monitore pagamentos no dashboard

---

**Última atualização**: 2025-01-30
**Versão**: 1.0.0


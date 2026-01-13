# Variáveis de Ambiente - Gateway de Pagamento (Stripe)

## Configuração do Gateway

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Gateway de Pagamento
# Opções: stripe (implementado), asaas (planejado), pagseguro (planejado)
PAYMENT_GATEWAY=stripe

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Descrição das Variáveis

### PAYMENT_GATEWAY
Gateway de pagamento a ser usado. Atualmente suportado:
- `stripe` (implementado)
- `asaas` (planejado)
- `pagseguro` (planejado)

### STRIPE_SECRET_KEY
Chave secreta do Stripe. Obtida no painel do desenvolvedor.

**Como obter**:
1. Acesse https://dashboard.stripe.com/apikeys
2. Copie a "Secret key" (test ou live)

**Importante**: Use sempre a chave de teste (`sk_test_...`) durante desenvolvimento.

### STRIPE_PUBLIC_KEY
Chave pública do Stripe. Usada no frontend para integração.

**Como obter**:
1. Acesse https://dashboard.stripe.com/apikeys
2. Copie a "Publishable key" (test ou live)

### STRIPE_WEBHOOK_SECRET
Secret para validar webhooks do Stripe. Obtido ao configurar o webhook endpoint.

**Como obter**:
1. Acesse https://dashboard.stripe.com/webhooks
2. Crie ou edite um endpoint
3. Copie o "Signing secret"

## Configuração do Webhook no Stripe

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. Configure a URL: `https://seu-dominio.com/api/webhooks/payment/stripe`
4. Selecione os eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.created`
   - `invoice.updated`
5. Copie o "Signing secret" e adicione em `STRIPE_WEBHOOK_SECRET`

## Exemplo de .env

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/churchapp

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# Gateway de Pagamento
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Notas de Segurança

- **NUNCA** commite o arquivo `.env` no repositório
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Rotacione as chaves periodicamente
- Use HTTPS em produção para webhooks
- Valide sempre a assinatura dos webhooks

## Testes

Para testes, use as credenciais de teste do Stripe:
- Acesse https://dashboard.stripe.com/test/apikeys
- Use cartões de teste fornecidos pelo Stripe:
  - Sucesso: `4242 4242 4242 4242`
  - Falha: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`

## Eventos de Webhook Suportados

O sistema processa os seguintes eventos do Stripe:

- **`customer.subscription.created`**: Nova assinatura criada
- **`customer.subscription.updated`**: Assinatura atualizada
- **`customer.subscription.deleted`**: Assinatura cancelada
- **`invoice.payment_succeeded`**: Pagamento bem-sucedido
- **`invoice.payment_failed`**: Falha no pagamento
- **`invoice.created`**: Nova fatura criada
- **`invoice.updated`**: Fatura atualizada

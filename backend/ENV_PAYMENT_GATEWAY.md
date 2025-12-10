# Variáveis de Ambiente - Gateway de Pagamento

## Configuração do Gateway

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Gateway de Pagamento
# Opções: mercadopago, asaas, pagseguro, stripe
PAYMENT_GATEWAY=mercadopago

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_BACK_URL=https://seu-dominio.com/subscription/success
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/payment/mercadopago
```

## Descrição das Variáveis

### PAYMENT_GATEWAY
Gateway de pagamento a ser usado. Atualmente suportado:
- `mercadopago` (implementado)
- `asaas` (planejado)
- `pagseguro` (planejado)
- `stripe` (planejado)

### MERCADOPAGO_ACCESS_TOKEN
Token de acesso do MercadoPago. Obtido no painel do desenvolvedor.

**Como obter**:
1. Acesse https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Copie o Access Token

### MERCADOPAGO_PUBLIC_KEY
Chave pública do MercadoPago. Usada no frontend para integração.

### MERCADOPAGO_WEBHOOK_SECRET
Secret para validar webhooks do MercadoPago. Configure no painel do MercadoPago.

### MERCADOPAGO_ENVIRONMENT
Ambiente de execução:
- `sandbox`: Ambiente de testes
- `production`: Ambiente de produção

**Importante**: Use sempre `sandbox` durante desenvolvimento e testes.

### MERCADOPAGO_BACK_URL
URL de retorno após o usuário completar o pagamento no checkout.

### MERCADOPAGO_WEBHOOK_URL
URL onde o MercadoPago enviará os webhooks. Configure esta URL no painel do MercadoPago.

## Configuração do Webhook no MercadoPago

1. Acesse o painel do MercadoPago
2. Vá em "Webhooks"
3. Adicione a URL: `https://seu-dominio.com/api/webhooks/payment/mercadopago`
4. Selecione os eventos:
   - `payment`
   - `preapproval`
   - `authorized_payment`
5. Copie o Webhook Secret e adicione em `MERCADOPAGO_WEBHOOK_SECRET`

## Exemplo de .env

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/churchapp

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# Gateway de Pagamento
PAYMENT_GATEWAY=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-TEST-123456789-123456-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-TEST-123456789-123456-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_BACK_URL=http://localhost:3000/subscription/success
MERCADOPAGO_WEBHOOK_URL=http://localhost:3000/api/webhooks/payment/mercadopago
```

## Notas de Segurança

- **NUNCA** commite o arquivo `.env` no repositório
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Rotacione os tokens periodicamente
- Use HTTPS em produção para webhooks
- Valide sempre a assinatura dos webhooks

## Testes

Para testes, use as credenciais de sandbox do MercadoPago:
- Acesse https://www.mercadopago.com.br/developers/panel
- Crie credenciais de teste
- Use cartões de teste fornecidos pelo MercadoPago



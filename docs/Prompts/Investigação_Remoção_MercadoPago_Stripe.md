# 🔍 Investigação: Remoção do MercadoPago e Verificação do Stripe

## 📋 Resumo Executivo

**Objetivo:** Remover todas as referências ao MercadoPago do projeto e verificar se o Stripe está configurado corretamente.

**Status:** Investigado - Aguardando Implementação

---

## 🔎 1. Onde o MercadoPago está Referenciado

### 1.1 Arquivos de Código Backend

#### **`backend/src/services/payment/types.ts`**
- **Linha 75:** Comentário sobre `customerEmail` necessário para Mercado Pago
- **Linha 76:** Comentário sobre `priceId` para compatibilidade com Stripe

#### **`backend/src/services/adminPlanService.ts`**
- **Linha 80:** Comentário sobre PreApproval Plan do Mercado Pago
- **Linha 93:** Comentário sobre IDs fictícios não usados no Mercado Pago

#### **`backend/src/controllers/payment/checkoutController.ts`**
- **Linha 157:** Comentário sobre `customerEmail` obrigatório para Mercado Pago

### 1.2 Arquivos de Documentação

#### **`backend/IMPLEMENTACAO_PAYMENT_GATEWAY.md`**
- Documento completo sobre implementação do MercadoPago
- Menciona `MercadoPagoGateway.ts` (arquivo não encontrado)
- Lista funcionalidades implementadas para MercadoPago
- Instruções de configuração do MercadoPago

#### **`backend/ENV_PAYMENT_GATEWAY.md`**
- Documentação completa das variáveis de ambiente do MercadoPago
- Exemplos de configuração
- Instruções de webhook do MercadoPago

#### **`GUIA_VERSIONAMENTO_PRE_PRODUCAO.md`**
- Variáveis de ambiente do MercadoPago em múltiplos lugares
- Configurações de sandbox e produção

#### **`FRONTEND_PAYMENT_GATEWAY_CHANGES.md`**
- Menciona redirecionamento para MercadoPago
- Referências a `checkoutUrl` do MercadoPago

#### **`GUIA_PRATICO_GATEWAY_PAGAMENTO.md`**
- Menciona MercadoPago como opção de gateway

#### **`render.yaml`**
- Variáveis de ambiente do MercadoPago configuradas
- `PAYMENT_GATEWAY=mercadopago` como padrão

#### **`docker-compose.production.yml`**
- Variáveis de ambiente do MercadoPago

### 1.3 Arquivos Frontend

#### **`mobile/src/components/PlanUpgradeModal.tsx`**
- Não encontradas referências diretas ao MercadoPago no código lido

#### **`web/src/components/PlanUpgradeModal.tsx`**
- Não encontradas referências diretas ao MercadoPago no código lido

### 1.4 Arquivos de Configuração

#### **`backend/package.json`**
- **NÃO encontrada** dependência `mercadopago` no `package.json`
- Isso indica que a implementação do MercadoPago pode não estar completa ou já foi parcialmente removida

---

## 🔎 2. Estado Atual do Stripe

### 2.1 Configuração no `env.ts`

**Arquivo:** `backend/src/env.ts`

**Status:** ✅ Configurado parcialmente

```typescript
// Payment Gateway
PAYMENT_GATEWAY: (process.env.PAYMENT_GATEWAY || 'stripe') as 'asaas' | 'pagseguro' | 'stripe',

// Stripe (adicionar conforme necessário)
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

// Validação
validatePaymentGateway() {
  if (this.PAYMENT_GATEWAY === 'stripe') {
    if (!this.STRIPE_SECRET_KEY && !this.isTest) {
      console.warn('⚠️ STRIPE_SECRET_KEY não configurado')
      return false
    }
  }
  return true
}
```

**Análise:**
- ✅ Variáveis de ambiente do Stripe estão definidas
- ✅ Validação básica implementada
- ⚠️ Apenas valida `STRIPE_SECRET_KEY`, não valida `STRIPE_PUBLIC_KEY` nem `STRIPE_WEBHOOK_SECRET`

### 2.2 Factory de Gateway

**Arquivo:** `backend/src/services/payment/PaymentGatewayFactory.ts`

**Status:** ❌ Stripe NÃO implementado

```typescript
case 'stripe':
  // TODO: Implementar quando necessário
  throw new Error('Gateway Stripe ainda não implementado')
```

**Análise:**
- ❌ Stripe não está implementado na factory
- ❌ Não existe classe `StripeGateway`
- ❌ A factory lança erro quando tenta criar gateway Stripe

### 2.3 Interface e Tipos

**Arquivo:** `backend/src/services/payment/PaymentGatewayInterface.ts` e `types.ts`

**Status:** ✅ Interface genérica pronta

**Análise:**
- ✅ Interface `PaymentGatewayInterface` é genérica e pode ser usada para Stripe
- ✅ Tipos incluem suporte para `clientSecret` (específico do Stripe)
- ✅ Tipos incluem suporte para `priceId` (compatibilidade com Stripe)

### 2.4 Controllers e Rotas

**Arquivo:** `backend/src/controllers/payment/checkoutController.ts`

**Status:** ✅ Preparado para Stripe

**Análise:**
- ✅ Controller já retorna `clientSecret` (linha 214)
- ✅ Controller já suporta `checkoutUrl` (linha 213)
- ✅ Lógica genérica que funciona com qualquer gateway

**Arquivo:** `backend/src/controllers/payment/webhookController.ts`

**Status:** ⚠️ Parcialmente preparado

**Análise:**
- ✅ Rota genérica `/webhooks/payment/:provider`
- ⚠️ Validação de webhook usa headers do MercadoPago (`x-signature`, `x-request-id`)
- ❌ Não há validação específica para Stripe (usaria `stripe-signature`)

### 2.5 Webhook Processor

**Arquivo:** `backend/src/services/payment/webhookProcessor.ts`

**Status:** ⚠️ Preparado para MercadoPago

**Análise:**
- ⚠️ Processa eventos específicos do MercadoPago (`payment`, `preapproval`, `authorized_payment`)
- ⚠️ Mapeia status do MercadoPago
- ❌ Não processa eventos do Stripe (`customer.subscription.created`, `invoice.payment_succeeded`, etc.)

### 2.6 Dependências

**Arquivo:** `backend/package.json`

**Status:** ❌ Stripe SDK não instalado

**Análise:**
- ❌ Não encontrada dependência `stripe` no `package.json`
- ❌ Não encontrada dependência `@stripe/stripe-js` no `package.json`

---

## 📊 3. Resumo do Estado Atual

### MercadoPago
- ✅ **Referências encontradas:** 13 arquivos
- ✅ **Implementação:** Não encontrada classe `MercadoPagoGateway.ts`
- ✅ **Dependência:** Não encontrada no `package.json`
- ⚠️ **Status:** Referências existem, mas implementação parece não estar completa

### Stripe
- ✅ **Configuração:** Variáveis de ambiente definidas
- ❌ **Implementação:** Não implementado (factory lança erro)
- ❌ **Dependência:** SDK não instalado
- ⚠️ **Webhooks:** Processador não preparado para eventos do Stripe
- ✅ **Interface:** Preparada e genérica

---

## 🎯 4. Plano de Ação Recomendado

### 4.1 Remover Referências ao MercadoPago

1. **Código Backend:**
   - Remover comentários sobre MercadoPago em `types.ts`, `adminPlanService.ts`, `checkoutController.ts`
   - Atualizar `webhookProcessor.ts` para remover lógica específica do MercadoPago (ou adaptar para Stripe)

2. **Documentação:**
   - Atualizar ou remover `IMPLEMENTACAO_PAYMENT_GATEWAY.md`
   - Atualizar ou remover `ENV_PAYMENT_GATEWAY.md`
   - Atualizar `GUIA_VERSIONAMENTO_PRE_PRODUCAO.md`
   - Atualizar `FRONTEND_PAYMENT_GATEWAY_CHANGES.md`
   - Atualizar `GUIA_PRATICO_GATEWAY_PAGAMENTO.md`
   - Atualizar `render.yaml`
   - Atualizar `docker-compose.production.yml`

3. **Frontend:**
   - Verificar se há referências ao MercadoPago nos componentes (não encontradas no código lido)

### 4.2 Implementar Stripe

1. **Instalar Dependência:**
   ```bash
   npm install stripe
   ```

2. **Criar `StripeGateway.ts`:**
   - Implementar `PaymentGatewayInterface`
   - Implementar todos os métodos necessários
   - Usar SDK do Stripe para comunicação

3. **Atualizar Factory:**
   - Adicionar caso `'stripe'` na factory
   - Instanciar `StripeGateway` com configurações do `env.ts`

4. **Atualizar Webhook Processor:**
   - Adicionar processamento de eventos do Stripe
   - Implementar validação de assinatura do Stripe (`stripe-signature`)
   - Mapear eventos do Stripe para nosso formato

5. **Atualizar Webhook Controller:**
   - Adicionar validação de assinatura do Stripe
   - Suportar header `stripe-signature`

6. **Atualizar Validação:**
   - Validar `STRIPE_PUBLIC_KEY` e `STRIPE_WEBHOOK_SECRET` além de `STRIPE_SECRET_KEY`

7. **Criar Documentação:**
   - Documentar variáveis de ambiente do Stripe
   - Documentar configuração de webhooks
   - Documentar eventos suportados

---

## ✅ 5. Checklist de Implementação

### Remoção do MercadoPago
- [ ] Remover comentários sobre MercadoPago no código
- [ ] Remover/atualizar documentação do MercadoPago
- [ ] Remover variáveis de ambiente do MercadoPago dos arquivos de configuração
- [ ] Verificar e remover referências no frontend (mobile e web)
- [ ] Verificar e remover referências em arquivos de deploy (render.yaml, docker-compose)

### Implementação do Stripe
- [ ] Instalar dependência `stripe`
- [ ] Criar classe `StripeGateway.ts` implementando `PaymentGatewayInterface`
- [ ] Atualizar `PaymentGatewayFactory.ts` para instanciar Stripe
- [ ] Atualizar `webhookProcessor.ts` para processar eventos do Stripe
- [ ] Atualizar `webhookController.ts` para validar assinatura do Stripe
- [ ] Atualizar validação em `env.ts` para validar todas as variáveis do Stripe
- [ ] Criar documentação de configuração do Stripe
- [ ] Testar criação de assinatura
- [ ] Testar webhooks do Stripe
- [ ] Testar cancelamento/retomada de assinatura

---

**Data da Análise:** 2025-01-27  
**Analisado por:** AI Assistant  
**Status:** Investigação Completa - Aguardando Implementação


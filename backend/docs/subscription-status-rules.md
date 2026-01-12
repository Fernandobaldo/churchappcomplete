# Regras de Status de Assinatura

## Visão Geral

Este documento descreve os status de assinatura e as transições válidas entre eles.

## Status Disponíveis

### `pending`
**Descrição**: Aguardando pagamento inicial. A assinatura foi criada no gateway, mas o pagamento ainda não foi confirmado.

**Quando ocorre**:
- Assinatura recém-criada
- Checkout criado, aguardando confirmação do pagamento

**Ações permitidas**:
- Cancelar assinatura
- Aguardar confirmação de pagamento

### `active`
**Descrição**: Assinatura ativa e em dia. Todas as cobranças foram pagas com sucesso.

**Quando ocorre**:
- Pagamento inicial confirmado
- Pagamento recorrente confirmado
- Assinatura retomada após cancelamento (se ainda dentro do período)

**Ações permitidas**:
- Cancelar assinatura (marca para cancelar no fim do período)
- Usuário tem acesso completo aos recursos do plano

### `past_due`
**Descrição**: Pagamento atrasado. A última cobrança falhou, mas ainda está dentro do período de retry do gateway.

**Quando ocorre**:
- Cobrança recorrente falhou (cartão recusado, saldo insuficiente, etc.)
- Gateway ainda está tentando processar o pagamento

**Ações permitidas**:
- Gateway tentará processar novamente automaticamente
- Usuário pode atualizar método de pagamento
- Após exceder tentativas, muda para `unpaid`

**Acesso do usuário**:
- Pode manter acesso temporário (depende da política do gateway)
- Deve atualizar método de pagamento

### `canceled`
**Descrição**: Assinatura cancelada pelo usuário. Ainda tem acesso até o fim do período atual.

**Quando ocorre**:
- Usuário cancelou a assinatura
- `cancelAtPeriodEnd` está como `true`

**Ações permitidas**:
- Retomar assinatura (se ainda dentro do período)
- Aguardar fim do período (depois arquivada)

**Acesso do usuário**:
- Mantém acesso até `currentPeriodEnd`
- Após `currentPeriodEnd`, não tem mais acesso

### `unpaid`
**Descrição**: Não pago. Após todas as tentativas de retry, o pagamento não foi processado.

**Quando ocorre**:
- Todas as tentativas de cobrança falharam
- Período de retry do gateway expirou

**Ações permitidas**:
- Usuário deve atualizar método de pagamento
- Criar nova assinatura

**Acesso do usuário**:
- Sem acesso aos recursos do plano
- Deve resolver o pagamento para reativar

### `trialing`
**Descrição**: Período de teste (trial). Usuário está no período de teste gratuito.

**Quando ocorre**:
- Assinatura criada com `trialDays > 0`
- Dentro do período de trial

**Ações permitidas**:
- Cancelar durante trial (muda para `canceled`)
- Aguardar fim do trial (muda para `active` se pagamento configurado)

**Acesso do usuário**:
- Acesso completo durante o trial
- Após trial, precisa de pagamento para continuar

## Transições Válidas

```
PENDING → ACTIVE          (pagamento confirmado)
PENDING → UNPAID          (pagamento falhou/rejeitado)
PENDING → CANCELED         (cancelado antes do pagamento)

ACTIVE → PAST_DUE         (cobrança falhou)
ACTIVE → CANCELED         (usuário cancelou)

PAST_DUE → ACTIVE         (pagamento recuperado)
PAST_DUE → UNPAID         (excedeu tentativas)

CANCELED → ACTIVE         (retomada dentro do período)
CANCELED → (arquivada)    (após fim do período)

TRIALING → ACTIVE         (fim do trial com pagamento)
TRIALING → CANCELED       (cancelado durante trial)
TRIALING → UNPAID         (trial acabou, pagamento falhou)

UNPAID → ACTIVE           (novo pagamento processado)
UNPAID → PENDING          (nova assinatura criada)
```

## Fluxo de Cancelamento

1. Usuário solicita cancelamento
2. `status` muda para `canceled`
3. `cancelAtPeriodEnd` = `true`
4. `canceledAt` = data atual
5. Usuário mantém acesso até `currentPeriodEnd`
6. Após `currentPeriodEnd`, acesso é revogado

## Fluxo de Retry de Pagamento

1. Cobrança falha → `status` = `past_due`
2. Gateway tenta novamente (conforme política)
3. Se sucesso → `status` = `active`
4. Se falha após todas tentativas → `status` = `unpaid`

## Considerações de Implementação

- Sempre validar transições antes de atualizar status
- Registrar todas as mudanças de status no AuditLog
- Notificar usuário sobre mudanças importantes de status
- Sincronizar status com gateway periodicamente (webhooks)

## Exemplos de Uso

### Criar assinatura com trial
```typescript
const subscription = await createSubscription({
  planId: 'plan_123',
  trialDays: 7
})
// status inicial: 'trialing'
```

### Processar pagamento aprovado
```typescript
// Webhook recebido: payment.approved
await updateSubscriptionStatus(subscriptionId, 'active')
```

### Cancelar assinatura
```typescript
await cancelSubscription(subscriptionId, true) // cancelAtPeriodEnd = true
// status: 'canceled'
// cancelAtPeriodEnd: true
// canceledAt: new Date()
```

### Retomar assinatura cancelada
```typescript
if (subscription.status === 'canceled' && subscription.currentPeriodEnd > new Date()) {
  await resumeSubscription(subscriptionId)
  // status: 'active'
  // cancelAtPeriodEnd: false
}
```








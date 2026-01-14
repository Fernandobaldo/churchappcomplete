# 📊 Relatório de Implementação: Planos e Subscriptions

**Data**: 2025-01-XX  
**Autor**: Análise Técnica do Código  
**Status**: Documentação do Estado Atual

---

## 📑 Índice

1. [Parte 1 — Modelagem (Prisma)](#parte-1--modelagem-prisma)
2. [Parte 2 — Seeds e Dados Padrão](#parte-2--seeds-e-dados-padrão)
3. [Parte 3 — Fluxos que Criam/Ativam Subscription](#parte-3--fluxos-que-criamativam-subscription)
4. [Parte 4 — Enforcement Atual (Limites e Features)](#parte-4--enforcement-atual-limites-e-features)
5. [Parte 5 — API / Contratos](#parte-5--api--contratos)
6. [Parte 6 — Integração com UI (Mobile/Web)](#parte-6--integração-com-ui-mobileweb)
7. [Parte 7 — Resumo Executivo](#parte-7--resumo-executivo)

---

## Parte 1 — Modelagem (Prisma)

### 1.1 Model Plan

**Localização**: `backend/prisma/schema.prisma` (linhas 176-191)

```prisma
model Plan {
  id               String         @id @default(cuid())
  name             String         @unique
  code             String?        @unique // Código estável para identificação (ex: 'FREE', 'PREMIUM')
  price            Float
  features         String[]
  maxBranches      Int?
  maxMembers       Int?
  isActive         Boolean        @default(true)
  gatewayProvider  String?
  gatewayProductId String?
  gatewayPriceId   String?
  billingInterval  String         @default("month")
  syncStatus       String         @default("pending")
  Subscription     Subscription[]
}
```

**Campos Implementados**:

| Campo | Tipo | Uso Atual | Observações |
|-------|------|-----------|-------------|
| `id` | String (CUID) | ✅ Identificador único | Gerado automaticamente |
| `name` | String | ✅ Identificação do plano | Ex: "free", "premium" |
| `code` | String? | ✅ Identificação estável | Ex: "FREE", "PREMIUM" |
| `price` | Float | ✅ Preço mensal | R$ 0.00 para free |
| `features` | String[] | ⚠️ Array de strings | **NÃO usado para enforcement** |
| `maxBranches` | Int? | ✅ **ENFORCEMENT ATIVO** | Null = ilimitado |
| `maxMembers` | Int? | ✅ **ENFORCEMENT ATIVO** | Null = ilimitado |
| `isActive` | Boolean | ✅ Filtro na listagem | Usado em `listPlans()` |
| `gatewayProvider` | String? | ⚠️ Preparado | Campo existe mas não verificado uso |
| `gatewayProductId` | String? | ⚠️ Preparado | Campo existe mas não verificado uso |
| `gatewayPriceId` | String? | ⚠️ Preparado | Campo existe mas não verificado uso |
| `billingInterval` | String | ✅ Padrão "month" | Usado no seed |
| `syncStatus` | String | ⚠️ Preparado | Campo existe mas não verificado uso |

### 1.2 Model Subscription

**Localização**: `backend/prisma/schema.prisma` (linhas 193-218)

```prisma
model Subscription {
  id                    String             @id @default(cuid())
  userId                String
  planId                String
  status                SubscriptionStatus @default(pending)
  startedAt             DateTime           @default(now())
  endsAt                DateTime?
  gatewayProvider       String?
  gatewaySubscriptionId String?
  gatewayCustomerId     String?
  paymentMethodId       String?
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean            @default(false)
  canceledAt            DateTime?
  trialEnd              DateTime?
  Plan                  Plan               @relation(fields: [planId], references: [id])
  User                  User               @relation(fields: [userId], references: [id])
  PaymentHistory        PaymentHistory[]
  
  @@index([planId])
  @@index([userId])
  @@index([gatewaySubscriptionId])
  @@index([gatewayCustomerId])
  @@index([status])
}
```

**Campos Implementados**:

| Campo | Tipo | Uso Atual | Observações |
|-------|------|-----------|-------------|
| `id` | String (CUID) | ✅ Identificador único | - |
| `userId` | String | ✅ **Relação com User** | **IMPORTANTE**: Subscription é por User, não por Church |
| `planId` | String | ✅ Referência ao plano | - |
| `status` | SubscriptionStatus | ✅ **ENFORCEMENT ATIVO** | Usado para filtrar active subscriptions |
| `startedAt` | DateTime | ✅ Timestamp de início | - |
| `endsAt` | DateTime? | ⚠️ Opcional | Não verificado se usado |
| `gatewayProvider` | String? | ⚠️ Preparado para Stripe | - |
| `gatewaySubscriptionId` | String? | ⚠️ Preparado | - |
| `gatewayCustomerId` | String? | ⚠️ Preparado | - |
| `paymentMethodId` | String? | ⚠️ Preparado | - |
| `currentPeriodStart` | DateTime? | ⚠️ Preparado | - |
| `currentPeriodEnd` | DateTime? | ⚠️ Preparado | - |
| `cancelAtPeriodEnd` | Boolean | ⚠️ Preparado | - |
| `canceledAt` | DateTime? | ⚠️ Preparado | - |
| `trialEnd` | DateTime? | ⚠️ Preparado | - |

**Enum SubscriptionStatus**:

```prisma
enum SubscriptionStatus {
  pending
  active
  past_due
  canceled
  unpaid
  trialing
}
```

### 1.3 Relacionamentos

**Diagrama Textual**:

```
User (1) ──→ (N) Subscription (N) ──→ (1) Plan
  │                                        │
  │                                        │ (limites)
  │                                        ├── maxMembers (Int?)
  │                                        └── maxBranches (Int?)
  │
  └──→ (0..1) Member (1) ──→ (1) Branch (N) ──→ (1) Church
```

**Observações Importantes**:

1. **Subscription é por User, não por Church**
   - Um User pode ter múltiplas Subscriptions (histórico)
   - O plano é vinculado ao User que criou a igreja
   - Quando um Member cria recursos, o sistema busca o plano do **ADMINGERAL da igreja** como fallback

2. **Fallback de Plano**:
   - Se o User atual não tem plano ativo, o sistema busca o plano do ADMINGERAL
   - Implementado em `backend/src/utils/planLimits.ts` (linhas 66-128)

3. **Tenancy Model**:
   - Church → Branch → Member → User
   - O plano do User (ADMINGERAL) governa todos os Members da Church
   - Limites (`maxMembers`, `maxBranches`) são contados por **Church**

### 1.4 Campos Usados para Enforcement

**✅ IMPLEMENTADO**:

- `maxMembers` (Int?): Limitado em `checkPlanMembersLimit()`
- `maxBranches` (Int?): Limitado em `checkPlanBranchesLimit()`
- `status` (SubscriptionStatus): Filtro para `active` apenas

**❌ NÃO IMPLEMENTADO**:

- `features` (String[]): Campo existe mas **não é usado para bloquear acesso a features**
- Validação de features em endpoints (ex: bloquear `/finances` se plano não tem `finances`)

---

## Parte 2 — Seeds e Dados Padrão

### 2.1 Seed de Plan (Desenvolvimento)

**Localização**: `backend/prisma/seed.ts` (linhas 17-90)

**Comando para executar**:
```bash
npm run seed  # ou npx tsx prisma/seed.ts
```

**Plano Criado**:

```typescript
{
  name: 'free',
  code: 'FREE',
  price: 0,
  features: [
    'events',        // Eventos
    'members',       // Membros
    'contributions', // Contribuições
    'devotionals',   // Devocionais
  ],
  maxBranches: 1,
  maxMembers: 20,
  billingInterval: 'month',
  isActive: true,
  gatewayProvider: 'stripe',
  gatewayProductId: 'prod_free',
  gatewayPriceId: 'price_free_0_month',
  syncStatus: 'synced',
}
```

**Comportamento do Seed**:

1. ✅ Verifica se plano "free" já existe (tenta `'free'`, `'Free'`, `'Free Plan'`)
2. ✅ Se não existe, cria o plano com as configurações acima
3. ✅ Se existe, verifica se tem `code` e atualiza se necessário
4. ✅ Valida features contra `AVAILABLE_PLAN_FEATURES` e atualiza se inválidas

**Features Válidas** (definidas em `backend/src/constants/planFeatures.ts`):

```typescript
AVAILABLE_PLAN_FEATURES = [
  { id: 'events', label: 'Eventos' },
  { id: 'members', label: 'Membros' },
  { id: 'contributions', label: 'Contribuições' },
  { id: 'finances', label: 'Finanças' },
  { id: 'devotionals', label: 'Devocionais' },
  { id: 'white_label_app', label: 'App White-label' },
  { id: 'advanced_reports', label: 'Relatórios Avançados' },
]
```

**Observações**:
- O seed é **idempotente** (pode rodar múltiplas vezes)
- O plano Free **não inclui** `finances`, `white_label_app`, `advanced_reports`

### 2.2 Seed para Testes

**Localização**: `backend/tests/utils/seedTestDatabase.ts` (linhas 16-42)

**Plano Criado para Testes**:

```typescript
{
  name: 'Free Plan',
  price: 0,
  features: ['basic'],
  maxMembers: 10,
  maxBranches: 1,
}
```

**Diferenças**:
- Nome: `'Free Plan'` vs `'free'`
- Features: `['basic']` vs array de IDs válidos
- Limites: `maxMembers: 10` vs `20`

**⚠️ INCONSISTÊNCIA**: O seed de teste usa features `['basic']` que **não está em `AVAILABLE_PLAN_FEATURES``.

### 2.3 Seed em Produção

**❌ NÃO IMPLEMENTADO**: Não há evidência de seed automático em produção.

**Riscos**:
- Se o plano Free não existir, `publicRegisterUserService` lançará erro
- Mensagem de erro: `"Plano gratuito não encontrado. Execute o seed do banco de dados."`

**Recomendação**: Criar migration ou script de deploy que garanta a existência do plano Free.

---

## Parte 3 — Fluxos que Criam/Ativam Subscription

### 3.1 Registro Público (Landing Page)

**Rota**: `POST /public/register`  
**Controller**: `backend/src/controllers/public/publicRegisterController.ts`  
**Service**: `backend/src/services/public/publicRegisterService.ts`

**Fluxo**:

```15:83:backend/src/services/public/publicRegisterService.ts
export async function publicRegisterUserService(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  document: string
}) {
  // ... validações ...
  
  // Busca o plano gratuito (tenta diferentes variações do nome)
  let freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
  if (!freePlan) {
    freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } })
  }
  if (!freePlan) {
    freePlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
  }
  if (!freePlan) {
    throw new Error('Plano gratuito não encontrado. Execute o seed do banco de dados.')
  }

  // Cria o usuário e associa o plano
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      document,
      Subscription: {
        create: {
          planId: freePlan.id,
          status: SubscriptionStatus.active,
        },
      },
    },
  })
  
  // ... retorna token JWT ...
}
```

**Plano Aplicado**: `free` (busca flexível: `'free'`, `'Free'`, `'Free Plan'`)  
**Status**: `SubscriptionStatus.active`  
**Quando Subscription vira active**: Imediatamente na criação  
**Fallback**: ❌ Lança erro se plano não existir  

### 3.2 Onboarding (Criação de Igreja)

**Rota**: `POST /churches`  
**Controller**: `backend/src/controllers/churchController.ts`  
**Service**: `backend/src/services/churchService.ts`

**Fluxo**:

```30:106:backend/src/services/churchService.ts
export class ChurchService {
  async createChurchWithMainBranch(data: CreateChurchData, user: UserData) {
    return await prisma.$transaction(async (tx) => {
      const church = await tx.church.create({
        data: {
          name: data.name,
          // ... outros campos ...
          createdByUserId: user.id,
        },
      })

      // Sempre cria branch principal (obrigatório para Member)
      const branch = await tx.branch.create({
        data: {
          name: data.branchName || 'Sede',
          churchId: church.id,
          isMainBranch: true,
        },
      })

      // Verifica se já existe um Member com esse userId ou email
      let existingMember = await tx.member.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
      })

      let member
      if (existingMember) {
        // Se já existe, atualiza para associar à nova branch e role
        member = await tx.member.update({
          where: { id: existingMember.id },
          data: {
            role: Role.ADMINGERAL,
            branchId: branch.id,
            userId: user.id,
          },
        })
      } else {
        // Se não existe, cria novo Member (sem senha - usa senha do User)
        const { getUserFullName } = await import('../utils/userUtils')
        member = await tx.member.create({
          data: {
            name: getUserFullName(user),
            email: user.email,
            role: Role.ADMINGERAL,
            branchId: branch.id,
            userId: user.id,
          },
        })
      }
      // ... cria permissões ...
    })
  }
}
```

**Observações**:
- ✅ **NÃO cria Subscription** — assume que User já tem Subscription do registro público
- ✅ **NÃO verifica se User tem plano ativo** — pode criar igreja sem plano (risco)
- ⚠️ **User deve ter Subscription ativa** — senão `checkPlanMembersLimit()` falhará depois

### 3.3 Registro de Membros (Interno)

**Rota**: `POST /register`  
**Controller**: `backend/src/controllers/auth/registerController.ts`  
**Service**: `backend/src/services/auth/registerService.ts`

**Fluxo**:

```32:334:backend/src/services/auth/registerService.ts
export async function registerUserService(data: RegisterUserInput) {
  // ... validações ...
  
  // Se for registro via link de convite
  if (inviteToken) {
    // ... cria User e Member ...
  } else {
    // Registro interno (criador é membro existente)
    if (creatorUserId) {
      // ... validações de permissão ...
      
      // ✅ VALIDA LIMITE DE PLANO
      await checkPlanMembersLimit(creatorUserId)
      
      // ... cria Member ...
    }
  }
}
```

**Plano Aplicado**: Usa plano do `creatorUserId` (verificado via `checkPlanMembersLimit`)  
**Status**: N/A (não cria Subscription, apenas valida limite)  
**Quando Subscription vira active**: N/A  
**Fallback**: Busca plano do ADMINGERAL se creatorUserId não tem plano  

### 3.4 Checkout/Stripe

**Rota**: `POST /subscriptions/checkout`  
**Controller**: `backend/src/controllers/payment/checkoutController.ts`  
**Route**: `backend/src/routes/paymentRoutes.ts`

**Status**: ✅ **IMPLEMENTADO**

**Fluxo**:

1. ✅ Valida `planId` (verifica se existe e está ativo)
2. ✅ Verifica se User já tem Subscription ativa
3. ✅ Gerencia troca de plano (cancela anterior se necessário)
4. ✅ Cria cliente no gateway (Stripe)
5. ✅ Cria Subscription no gateway
6. ✅ Cria Subscription no banco com status do gateway
7. ✅ Registra no audit log

**Plano Aplicado**: `planId` fornecido no body  
**Status**: Status retornado pelo gateway (`active`, `trialing`, `past_due`)  
**Quando Subscription vira active**: Após criação bem-sucedida no gateway  
**Fallback**: ❌ Não há fallback — se gateway falhar, retorna erro 500

**Validações Implementadas**:
- ✅ Plano existe e está ativo
- ✅ Usuário autenticado
- ✅ Previne múltiplas subscriptions Free
- ✅ Gerencia cancelamento de subscription anterior na troca de plano

**Campos Criados**:
- `gatewaySubscriptionId`
- `gatewayCustomerId`
- `paymentMethodId`
- `currentPeriodStart`, `currentPeriodEnd`
- `trialEnd`

**Webhooks**:

**Rota**: `POST /webhooks/payment/:provider`  
**Controller**: `backend/src/controllers/payment/webhookController.ts`

**Status**: ⚠️ **IMPLEMENTAÇÃO PARCIAL** — Arquivo existe mas não foi analisado.

### 3.5 Mudança de Plano

**Rota**: `POST /subscriptions/change`  
**Controller**: `backend/src/controllers/subscriptionController.ts`  
**Service**: `backend/src/services/subscriptionService.ts`

**Fluxo**:

```17:31:backend/src/services/subscriptionService.ts
export async function changePlan(userId: string, planId: string) {
  // Opcional: encerrar assinaturas anteriores
  await prisma.subscription.updateMany({
    where: { userId, status: SubscriptionStatus.active },
    data: { status: SubscriptionStatus.canceled, endsAt: new Date() }
  });

  return prisma.subscription.create({
    data: {
      userId,
      planId,
      status: SubscriptionStatus.active
    }
  });
}
```

**Plano Aplicado**: O `planId` fornecido  
**Status**: `SubscriptionStatus.active` imediatamente  
**Quando Subscription vira active**: Imediatamente na criação  
**Fallback**: ❌ Não valida se `planId` existe ou se User tem permissão  

**⚠️ RISCO**: Não há validação de:
- Se `planId` existe
- Se User tem permissão para mudar para esse plano
- Se há pagamento pendente

### 3.6 Resumo de Fluxos

| Fluxo | Cria Subscription? | Plano | Status Inicial | Fallback |
|-------|-------------------|-------|----------------|----------|
| Registro Público | ✅ Sim | `free` | `active` | ❌ Erro se não existe |
| Onboarding (Church) | ❌ Não | N/A | N/A | ⚠️ Assume que User tem plano |
| Registro Member | ❌ Não | N/A | N/A | ✅ Busca ADMINGERAL |
| Checkout/Stripe | ✅ Sim | `planId` do body | Status do gateway | ✅ Valida planId, cancela anterior se necessário |
| Mudança Manual | ✅ Sim | `planId` | `active` | ❌ Não valida planId |

---

## Parte 4 — Enforcement Atual (Limites e Features)

### 4.1 Enforcement de Limites

#### ✅ `maxMembers` — IMPLEMENTADO

**Localização**: `backend/src/utils/planLimits.ts` (função `checkPlanMembersLimit`)

**Onde é chamado**:

1. **Criação de Membros** (`backend/src/services/auth/registerService.ts`, linha 239):
   ```typescript
   await checkPlanMembersLimit(creatorUserId)
   ```

2. **Criação via Invite Link** (`backend/src/services/inviteLinkService.ts`, linha 74):
   ```typescript
   await checkPlanMembersLimit(createdBy)
   ```

**Lógica**:

```10:148:backend/src/utils/planLimits.ts
export async function checkPlanMembersLimit(userId: string): Promise<void> {
  // 1. Buscar User e Subscription ativa
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Subscription: {
        where: { status: SubscriptionStatus.active },
        include: { Plan: true },
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  // ... busca plano (próprio ou do ADMINGERAL) ...
  
  // 2. Se maxMembers for null, significa ilimitado
  if (plan.maxMembers === null) {
    return
  }

  // 3. Contar membros existentes em todas as branches da igreja
  const branches = await prisma.branch.findMany({
    where: { churchId },
    include: { _count: { select: { Member: true } } },
  })

  const totalMembers = branches.reduce((sum, b) => sum + b._count.Member, 0)

  // 4. Verificar limite
  if (totalMembers >= plan.maxMembers) {
    const errorMsg = `Limite do plano atingido: máximo de ${plan.maxMembers} membros excedido. Você tem ${totalMembers} membros.`
    throw new Error(errorMsg)
  }
}
```

**Comportamento**:
- ✅ Conta todos os Members de todas as Branches da Church
- ✅ Compara com `plan.maxMembers`
- ✅ Retorna erro se limite excedido
- ✅ Permite se `maxMembers === null` (ilimitado)
- ✅ Fallback: busca plano do ADMINGERAL se User não tem plano

#### ✅ `maxBranches` — IMPLEMENTADO

**Localização**: `backend/src/utils/planLimits.ts` (função `checkPlanBranchesLimit`)

**Onde é chamado**:

1. **Criação de Branches** (`backend/src/services/branchService.ts`, linha 44):
   ```typescript
   await checkPlanBranchesLimit(creatorUserId)
   ```

**Lógica**:

```156:291:backend/src/utils/planLimits.ts
export async function checkPlanBranchesLimit(userId: string): Promise<void> {
  // ... busca plano (similar a checkPlanMembersLimit) ...
  
  // 2. Se maxBranches for null, significa ilimitado
  if (plan.maxBranches === null) {
    return
  }

  // 3. Contar branches existentes da igreja
  const branchesCount = await prisma.branch.count({
    where: { churchId },
  })

  // 4. Verificar limite
  if (branchesCount >= plan.maxBranches) {
    throw new Error(
      `Limite do plano atingido: máximo de ${plan.maxBranches} filiais excedido. Você tem ${branchesCount} filiais.`
    )
  }
}
```

**Comportamento**:
- ✅ Conta todas as Branches da Church
- ✅ Compara com `plan.maxBranches`
- ✅ Retorna erro se limite excedido
- ✅ Permite se `maxBranches === null` (ilimitado)
- ✅ Fallback: busca plano do ADMINGERAL se User não tem plano

### 4.2 Enforcement de Features

**❌ NÃO IMPLEMENTADO**: Não há enforcement de features por plano.

**Evidência**:
- ✅ Campo `features` existe no modelo `Plan`
- ✅ Constante `AVAILABLE_PLAN_FEATURES` existe
- ❌ **NÃO há middleware `requireFeature()`**
- ❌ **NÃO há verificação de features em endpoints**

**Exemplo do que NÃO existe**:

```typescript
// ❌ NÃO EXISTE
export function requireFeature(featureId: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    const subscription = await getMySubscription(user.id)
    const plan = subscription?.Plan
    
    if (!plan?.features.includes(featureId)) {
      return reply.code(403).send({ 
        message: `Feature '${featureId}' não disponível no seu plano. Faça upgrade.` 
      })
    }
  }
}

// ❌ NÃO USADO EM NENHUM ENDPOINT
app.get('/finances', {
  preHandler: [authenticate, requireFeature('finances')],
  handler: getFinancesHandler
})
```

**Features Definidas**:

```1:12:backend/src/constants/planFeatures.ts
export const AVAILABLE_PLAN_FEATURES = [
  { id: 'events', label: 'Eventos', description: 'Gerencie cultos e eventos' },
  { id: 'members', label: 'Membros', description: 'Gerencie membros da igreja' },
  { id: 'contributions', label: 'Contribuições', description: 'Gerencie ofertas e dízimos' },
  { id: 'finances', label: 'Finanças', description: 'Controle financeiro completo' },
  { id: 'devotionals', label: 'Devocionais', description: 'Compartilhe devocionais' },
  { id: 'white_label_app', label: 'App White-label', description: 'App personalizado para a igreja' },
  { id: 'advanced_reports', label: 'Relatórios Avançados', description: 'Relatórios detalhados e analytics' },
] as const

export type PlanFeatureId = typeof AVAILABLE_PLAN_FEATURES[number]['id']
```

**Risco Atual**:
- Usuário do plano Free pode acessar `/finances` mesmo sem ter a feature `finances`
- Apenas limites (`maxMembers`, `maxBranches`) são bloqueados

### 4.3 Tabela de Enforcement Matrix

| Regra | Existe? | Onde (arquivo/função) | Server-side? | Observações |
|-------|---------|----------------------|--------------|-------------|
| Bloqueio criação acima de `maxMembers` | ✅ Sim | `backend/src/utils/planLimits.ts:checkPlanMembersLimit()` | ✅ Sim | Chamado em `registerService` e `inviteLinkService` |
| Bloqueio criação acima de `maxBranches` | ✅ Sim | `backend/src/utils/planLimits.ts:checkPlanBranchesLimit()` | ✅ Sim | Chamado em `branchService` |
| Bloqueio acesso a `/finances` sem feature | ❌ Não | N/A | ❌ Não | Endpoint existe mas não verifica feature |
| Bloqueio acesso a `/reports` sem feature | ❌ Não | N/A | ❌ Não | Não verificado se endpoint existe |
| Bloqueio acesso a white-label sem feature | ❌ Não | N/A | ❌ Não | Não verificado |
| `PlanUpgradeModal` (UI) | ❓ Não verificado | N/A | N/A | Ver Parte 6 |
| Endpoint `/entitlements` | ❌ Não | N/A | ❌ Não | Não existe |
| Guard `requireFeature()` | ❌ Não | N/A | ❌ Não | Não implementado |
| Guard `requireLimit()` | ❌ Não | N/A | ❌ Não | Não implementado (limites são verificados inline) |
| UX de "upgrade required" | ❓ Não verificado | N/A | N/A | Ver Parte 6 |

---

## Parte 5 — API / Contratos

### 5.1 Endpoints Públicos

#### `GET /plans`

**Localização**: `backend/src/routes/planRoutes.ts` (linhas 12-15)  
**Controller**: `backend/src/controllers/planController.ts:listPlansHandler`  
**Service**: `backend/src/services/planService.ts:listPlans()`

**Comportamento**:
```typescript
// Retorna apenas planos ativos, ordenados por preço
export async function listPlans() {
  return prisma.plan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      price: 'asc',
    },
  });
}
```

**Acesso**: ✅ Público (sem autenticação)  
**Retorno**: Array de Plan objects  
**Validação de Tenant**: ❌ N/A (público)  

### 5.2 Endpoints Autenticados

#### `GET /subscriptions/me` ou `/subscriptions/current`

**Localização**: `backend/src/routes/subscriptionRoutes.ts` (linhas 13-24)  
**Controller**: `backend/src/controllers/subscriptionController.ts:getMySubscriptionHandler`  
**Service**: `backend/src/services/subscriptionService.ts:getMySubscription()`

**Comportamento**:
```typescript
export async function getMySubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.active },
    include: { Plan: true }
  });
}
```

**Acesso**: ✅ Autenticado (`authenticate` middleware)  
**Retorno**: Subscription com Plan incluído  
**Validação de Tenant**: ✅ Sim (via `userId` do JWT)  

#### `POST /subscriptions/change`

**Localização**: `backend/src/routes/subscriptionRoutes.ts` (linhas 27-31)  
**Controller**: `backend/src/controllers/subscriptionController.ts:changePlanHandler`  
**Service**: `backend/src/services/subscriptionService.ts:changePlan()`

**Acesso**: ✅ Autenticado  
**Validação de Tenant**: ✅ Sim (via `userId` do JWT)  
**Validação de `planId`**: ❌ **NÃO VERIFICA** se planId existe  

#### `POST /subscriptions/checkout`

**Localização**: `backend/src/routes/paymentRoutes.ts` (linhas 14-17)  
**Controller**: `backend/src/controllers/payment/checkoutController.ts`

**Acesso**: ✅ Autenticado  
**Status**: ⚠️ **NÃO VERIFICADO** (arquivo existe mas não foi lido)  

#### `POST /webhooks/payment/:provider`

**Localização**: `backend/src/routes/paymentRoutes.ts` (linhas 38-41)  
**Controller**: `backend/src/controllers/payment/webhookController.ts`

**Acesso**: ❌ Sem autenticação (webhook externo)  
**Status**: ⚠️ **NÃO VERIFICADO** (arquivo existe mas não foi lido)  

### 5.3 Endpoints Admin

#### `GET /admin/plans`

**Localização**: `backend/src/routes/adminRoutes.ts` (linhas 168-171)  
**Acesso**: ✅ Admin autenticado (`adminAuthenticate`)  

#### `POST /admin/plans`

**Localização**: `backend/src/routes/adminRoutes.ts` (linhas 178-181)  
**Acesso**: ✅ Admin com role `SUPERADMIN`  

#### `PATCH /admin/plans/:id`

**Localização**: `backend/src/routes/adminRoutes.ts` (linhas 183-186)  
**Acesso**: ✅ Admin com role `SUPERADMIN`  

#### `GET /admin/subscriptions`

**Localização**: `backend/src/routes/adminRoutes.ts` (linhas 199-205)  
**Acesso**: ✅ Admin com role `SUPERADMIN` ou `FINANCE`  

#### `PATCH /admin/subscriptions/:id/plan`

**Localização**: `backend/src/routes/adminRoutes.ts` (linhas 223-229)  
**Acesso**: ✅ Admin com role `SUPERADMIN` ou `FINANCE`  

**Observações**:
- ✅ Validação de roles implementada
- ⚠️ **NÃO VERIFICADO** se valida tenant em endpoints admin (provavelmente não, pois admin pode ver tudo)

### 5.4 Resumo de Endpoints

| Endpoint | Método | Acesso | Valida Tenant? | Status |
|----------|--------|--------|----------------|--------|
| `/plans` | GET | Público | N/A | ✅ Implementado |
| `/subscriptions/me` | GET | Autenticado | ✅ Sim | ✅ Implementado |
| `/subscriptions/current` | GET | Autenticado | ✅ Sim | ✅ Implementado (alias) |
| `/subscriptions/change` | POST | Autenticado | ✅ Sim | ⚠️ Não valida planId |
| `/subscriptions/checkout` | POST | Autenticado | ✅ Sim | ✅ Implementado (cria subscription no gateway e banco) |
| `/webhooks/payment/:provider` | POST | Webhook | N/A | ⚠️ Não verificado |
| `/admin/plans` | GET | Admin | ❌ Não | ✅ Implementado |
| `/admin/plans` | POST | Admin (SUPERADMIN) | ❌ Não | ✅ Implementado |
| `/admin/subscriptions/:id/plan` | PATCH | Admin (SUPERADMIN/FINANCE) | ❌ Não | ✅ Implementado |

---

## Parte 6 — Integração com UI (Mobile/Web)

### 6.1 Frontend Web

**❓ NÃO VERIFICADO EM DETALHE**: Não há evidência de:

- Componente `PlanUpgradeModal`
- Tela de planos/subscriptions
- Bloqueio UI baseado em features
- Chamadas a `/plans` ou `/subscriptions/me`

**Busca realizada**: `codebase_search` por "plan features" no frontend não retornou resultados relevantes.

**Conclusão**: Provavelmente **NÃO IMPLEMENTADO** ou implementado de forma muito básica.

### 6.2 Mobile

**❓ NÃO VERIFICADO EM DETALHE**: 

- Não há evidência de verificação de features no mobile
- `mobile/src/utils/authUtils.ts` apenas verifica `role` e `permissions`, não features do plano

**Evidência**:

```11:19:mobile/src/utils/authUtils.ts
export function hasAccess(user: User | null, permission: string): boolean {
    if (!user) return false

    return (
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL'
        // ... verifica permissions ...
    )
}
```

**Conclusão**: Mobile **não verifica features do plano**, apenas roles e permissions.

### 6.3 Resumo de Integração UI

| Funcionalidade | Web | Mobile | Observações |
|----------------|-----|--------|-------------|
| Exibição de plano atual | ❓ Não verificado | ❓ Não verificado | - |
| Modal de upgrade | ❓ Não verificado | ❓ Não verificado | - |
| Bloqueio UI de features | ❌ Não implementado | ❌ Não implementado | Apenas server-side (se implementado) |
| Tela de planos | ❓ Não verificado | ❓ Não verificado | - |
| Chamada a `/plans` | ❓ Não verificado | ❓ Não verificado | - |
| Chamada a `/subscriptions/me` | ❓ Não verificado | ❓ Não verificado | - |
| Mensagem "limite atingido" | ❓ Não verificado | ❓ Não verificado | Erro vem do backend |

---

## Parte 7 — Resumo Executivo

### 7.1 O que já temos

✅ **Modelagem Completa**:
- Modelos `Plan` e `Subscription` bem estruturados
- Relacionamento User → Subscription → Plan
- Campos para integração com gateway (Stripe)

✅ **Seeds Funcionais**:
- Seed cria plano Free automaticamente
- Idempotente (pode rodar múltiplas vezes)

✅ **Enforcement de Limites**:
- `maxMembers` bloqueado em criação de membros
- `maxBranches` bloqueado em criação de branches
- Fallback para plano do ADMINGERAL

✅ **Fluxo de Registro**:
- Registro público cria Subscription automaticamente
- Status `active` imediatamente

✅ **API Básica**:
- Endpoints para listar planos (público)
- Endpoints para consultar subscription (autenticado)
- Endpoints admin para gerenciar planos

### 7.2 Riscos atuais

⚠️ **CRÍTICO — Features não governam acesso**:
- Campo `features` existe mas **não é usado para bloquear endpoints**
- Usuário Free pode acessar `/finances` mesmo sem ter a feature
- Não há middleware `requireFeature()`

⚠️ **ALTO — Seed não roda em produção automaticamente**:
- Se plano Free não existir, registro público falha
- Não há migration ou script de deploy que garanta plano

⚠️ **MÉDIO — Mudança de plano sem validação**:
- `POST /subscriptions/change` não valida se `planId` existe
- Não verifica se User tem permissão para aquele plano
- Não verifica pagamento

⚠️ **MÉDIO — Onboarding não valida plano**:
- Criação de igreja não verifica se User tem Subscription ativa
- Pode criar igreja sem plano (erro aparecerá depois ao criar membro)

⚠️ **BAIXO — Inconsistência em seeds de teste**:
- Seed de teste usa features `['basic']` que não está em `AVAILABLE_PLAN_FEATURES`

### 7.3 O que falta para um mecanismo completo de planos

❌ **Enforcement de Features**:
- Middleware `requireFeature(featureId)`
- Bloqueio server-side em endpoints críticos (`/finances`, `/reports`, etc.)
- Endpoint `/entitlements` que retorna features disponíveis

❌ **Integração com Gateway**:
- Validação completa de checkout/Stripe
- Webhooks funcionando
- Sincronização de status de pagamento

❌ **UX de Upgrade**:
- Modal de upgrade quando limite atingido
- Tela de planos no frontend
- Mensagens claras de "upgrade required"

❌ **Validações Robustas**:
- Validação de `planId` em mudança de plano
- Verificação de plano antes de criar igreja
- Validação de permissões para mudar plano

❌ **Monitoramento**:
- Logs quando limite é atingido
- Métricas de uso por plano
- Alertas para admins

### 7.4 Recomendações imediatas (Top 5)

#### 1. **Implementar Enforcement de Features** (Prioridade: CRÍTICA)

**Ação**: Criar middleware `requireFeature()` e aplicar em endpoints críticos.

**Exemplo**:
```typescript
// backend/src/middlewares/requireFeature.ts
export function requireFeature(featureId: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user) {
      return reply.code(401).send({ message: 'Não autenticado' })
    }
    
    const subscription = await getMySubscription(user.id)
    if (!subscription?.Plan?.features.includes(featureId)) {
      return reply.code(403).send({ 
        message: `Feature '${featureId}' não disponível no seu plano. Faça upgrade.`,
        code: 'FEATURE_NOT_AVAILABLE',
        requiredFeature: featureId
      })
    }
  }
}

// Aplicar em:
app.get('/finances', {
  preHandler: [authenticate, requireFeature('finances')],
  handler: getFinancesHandler
})
```

**Impacto**: Bloqueia acesso a features premium sem plano adequado.

---

#### 2. **Garantir Plano Free em Produção** (Prioridade: ALTA)

**Ação**: Criar migration ou script de deploy que cria plano Free se não existir.

**Opções**:
- Migration Prisma que executa seed
- Script de deploy que roda antes do app iniciar
- Health check que alerta se plano não existe

**Impacto**: Evita falha em registro público.

---

#### 3. **Validar `planId` em Mudança de Plano** (Prioridade: MÉDIA)

**Ação**: Adicionar validação em `changePlan()`.

**Exemplo**:
```typescript
export async function changePlan(userId: string, planId: string) {
  // Validar se plano existe e está ativo
  const plan = await prisma.plan.findUnique({ 
    where: { id: planId, isActive: true } 
  })
  if (!plan) {
    throw new Error('Plano não encontrado ou inativo')
  }
  
  // ... resto do código ...
}
```

**Impacto**: Evita criação de Subscription com planId inválido.

---

#### 4. **Criar Endpoint `/entitlements`** (Prioridade: MÉDIA)

**Ação**: Endpoint que retorna features disponíveis do plano atual.

**Exemplo**:
```typescript
app.get('/entitlements', {
  preHandler: [authenticate],
  handler: async (request, reply) => {
    const user = request.user
    const subscription = await getMySubscription(user.id)
    return reply.send({
      plan: subscription?.Plan?.name,
      features: subscription?.Plan?.features || [],
      limits: {
        maxMembers: subscription?.Plan?.maxMembers,
        maxBranches: subscription?.Plan?.maxBranches,
      }
    })
  }
})
```

**Impacto**: Frontend pode verificar features sem fazer múltiplas chamadas.

---

#### 5. **Validar Plano Antes de Criar Igreja** (Prioridade: BAIXA)

**Ação**: Adicionar verificação em `createChurchWithMainBranch()`.

**Exemplo**:
```typescript
async createChurchWithMainBranch(data: CreateChurchData, user: UserData) {
  // Verificar se User tem Subscription ativa
  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId: user.id, 
      status: SubscriptionStatus.active 
    }
  })
  if (!subscription) {
    throw new Error('Você precisa ter um plano ativo para criar uma igreja.')
  }
  
  // ... resto do código ...
}
```

**Impacto**: Erro aparece antes de criar igreja, não depois.

---

### 7.5 Decisões Pendentes

#### Decisão 1: Subscription por User vs Church

**Estado Atual**: Subscription é por `User` (linha 195 do schema).

**Pergunta**: Faz sentido um User ter Subscription e todos os Members da Church herdarem?

**Opções**:
1. **Manter atual** (Subscription por User):
   - ✅ Mais simples
   - ✅ Um User pode ter múltiplas igrejas (futuro)
   - ❌ Limites são por Church, não por User

2. **Mudar para Subscription por Church**:
   - ✅ Alinhado com limites (maxMembers é por Church)
   - ✅ Mais intuitivo
   - ❌ Requer migration e refatoração

**Recomendação**: **Manter atual**, mas documentar claramente que limites são aplicados por Church (já implementado no fallback para ADMINGERAL).

---

#### Decisão 2: Validação de Features

**Estado Atual**: Features não são validadas.

**Pergunta**: Todas as features devem bloquear endpoints ou apenas algumas?

**Opções**:
1. **Bloquear todas**:
   - `events`, `members`, `contributions`, `devotionals` bloqueiam acesso
   - Mais seguro, mas pode ser restritivo demais

2. **Bloquear apenas premium**:
   - Apenas `finances`, `white_label_app`, `advanced_reports` bloqueiam
   - Features básicas sempre disponíveis

**Recomendação**: **Bloquear apenas premium** (`finances`, `white_label_app`, `advanced_reports`).

---

### 7.6 Métricas e Monitoramento Sugeridas

**Não Implementado**, mas recomendado:

1. **Log quando limite é atingido**:
   - Usar `AuditLogger` com action `PLAN_LIMIT_EXCEEDED`
   - Incluir `planId`, `churchId`, `limitType`, `currentValue`, `maxValue`

2. **Métricas de uso**:
   - Membros criados por plano
   - Branches criadas por plano
   - Tentativas de acesso a features bloqueadas

3. **Alertas**:
   - Quando plano Free está quase no limite (ex: 18/20 membros)
   - Quando múltiplos usuários atingem limite no mesmo dia

---

## 📝 Conclusão

O sistema possui uma **base sólida** de planos e subscriptions, com enforcement de limites (`maxMembers`, `maxBranches`) **funcionando corretamente**. No entanto, **falta enforcement de features**, o que permite acesso a funcionalidades premium sem plano adequado.

**Prioridade imediata**: Implementar `requireFeature()` middleware e aplicar em endpoints críticos (`/finances`, `/reports`).

---

**Última atualização**: 2025-01-XX  
**Versão do documento**: 1.0

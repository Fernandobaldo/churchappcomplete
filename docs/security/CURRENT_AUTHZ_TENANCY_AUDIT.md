# Auditoria de Segurança Multi-Tenant - Backend

**Data:** 2025-02-01  
**Versão:** 1.0  
**Escopo:** Backend - Autenticação, Autorização e Isolamento de Tenant  
**Tipo:** Auditoria (sem mudanças de código)

---

## 📋 Sumário Executivo

Esta auditoria analisa a implementação atual de segurança multi-tenant no backend, focando em:
1. **Autenticação**: Como JWT é criado e verificado, como `request.user` é populado
2. **Autorização**: Middlewares, checks de permissão e role
3. **Isolamento de Tenant**: Como `churchId`/`branchId` são aplicados em queries Prisma
4. **Vulnerabilidades**: Rotas que não aplicam isolamento, aceitam tenant IDs do cliente, ou têm risco de IDOR

**Status Geral:** ✅ **Bom** - Maioria das rotas aplica isolamento corretamente, mas há alguns pontos de atenção.

---

## 1. Autenticação (JWT)

### 1.1. Criação de Token JWT

**Arquivo:** `backend/src/services/authService.ts`

**Método:** `buildTokenPayload()` (linhas 31-63)

```typescript
const tokenPayload: any = {
  sub: user.id,
  email: user.email,
  name: fullName,
  type: type,
  onboardingCompleted,
}

if (member) {
  tokenPayload.memberId = member.id
  tokenPayload.role = member.role
  tokenPayload.branchId = member.branchId
  tokenPayload.churchId = member.Branch?.Church?.id || null
  tokenPayload.permissions = member.Permission?.map((p: any) => p.type) || []
}
```

**Claims do Token:**
- `sub`: ID do usuário (userId)
- `userId`: ID do usuário (alias de sub)
- `email`: Email do usuário
- `type`: 'user' ou 'member'
- `memberId`: ID do membro (se aplicável)
- `role`: Role do membro (ADMINGERAL, ADMINFILIAL, COORDINATOR, MEMBER)
- `branchId`: ID da filial do membro
- `churchId`: ID da igreja (via Branch.Church)
- `permissions`: Array de strings com tipos de permissão
- `onboardingCompleted`: Boolean

**Observações:**
- ✅ Token inclui contexto completo de tenant (`branchId`, `churchId`)
- ✅ Permissões são incluídas no token (mas também verificadas no banco)
- ⚠️ Token expira em 7 dias (pode ser longo para segurança crítica)

---

### 1.2. Verificação de Token e População de `request.user`

**Arquivo:** `backend/src/middlewares/authenticate.ts`

**Método:** `authenticate()` (linhas 17-56)

```typescript
const payload = jwt.verify(token, JWT_SECRET) as {
  sub: string
  userId?: string
  email: string
  type?: 'user' | 'member'
  permissions?: string[]
  role?: string | null
  branchId?: string | null
  memberId?: string | null
  churchId?: string | null
}

request.user = {
  id: payload.sub,
  userId: payload.userId || payload.sub,
  email: payload.email,
  type: payload.type || 'user',
  permissions: payload.permissions || [],
  role: payload.role || null,
  branchId: payload.branchId || null,
  memberId: payload.memberId || null,
  churchId: payload.churchId || null,
}
```

**Observações:**
- ✅ Token é verificado com `JWT_SECRET` do ambiente
- ✅ `request.user` é populado com todos os claims do token
- ✅ Campos podem ser `null` se usuário não tem Member associado
- ⚠️ Não há validação adicional de que `branchId`/`churchId` ainda existem no banco (token pode estar desatualizado)

---

## 2. Autorização

### 2.1. Middleware de Autenticação

**Arquivo:** `backend/src/middlewares/authenticate.ts`

**Uso:** Aplicado via `app.authenticate` ou `preHandler: [authenticate]`

**Comportamento:**
- Verifica header `Authorization: Bearer <token>`
- Retorna 401 se token ausente ou inválido
- Popula `request.user` com dados do token

---

### 2.2. Middleware de Role (`checkRole`)

**Arquivo:** `backend/src/middlewares/checkRole.ts`

**Método:** `checkRole(required: string[])` (linhas 3-17)

```typescript
export function checkRole(required: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const hasRole = user?.role && required.includes(user.role)
    if (!hasRole) {
      return reply.code(403).send({ 
        message: `Acesso negado: Role insuficiente. Necessário: ${required.join(' ou ')}, Atual: ${user?.role || 'não definida'}` 
      })
    }
  }
}
```

**Observações:**
- ✅ Verifica role do token
- ⚠️ Não verifica role no banco (confia apenas no token)
- ⚠️ Não verifica isolamento de tenant (apenas role)

---

### 2.3. Middleware de Permissão (`checkPermission`)

**Arquivo:** `backend/src/middlewares/checkPermission.ts`

**Método:** `checkPermission(requiredPermissions: string[])` (linhas 4-58)

```typescript
export function checkPermission(requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    // ADMINGERAL e ADMINFILIAL têm automaticamente todas as permissões
    if (user?.role === 'ADMINGERAL' || user?.role === 'ADMINFILIAL') {
      return; // Permite acesso
    }

    // Busca as permissões atualizadas do banco de dados
    let memberPermissions: string[] = [];
    if (user?.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { Permission: { select: { type: true } } }
      });
      if (member) {
        memberPermissions = member.Permission.map(p => p.type);
      }
    }

    const hasPermission = requiredPermissions.every(permission =>
      memberPermissions.includes(permission)
    );

    if (!hasPermission) {
      return reply.code(403).send({ 
        message: `Acesso negado: Permissão insuficiente...` 
      });
    }
  };
}
```

**Observações:**
- ✅ ADMINGERAL e ADMINFILIAL têm todas as permissões automaticamente
- ✅ Busca permissões do banco (não confia apenas no token)
- ✅ Fallback para permissões do token se member não encontrado
- ⚠️ Não verifica isolamento de tenant (apenas permissão)

---

### 2.4. Middleware de BranchId (`checkBranchId`)

**Arquivo:** `backend/src/middlewares/checkBranchId.ts`

**Método:** `checkBranchId()` (linhas 8-18)

```typescript
export function checkBranchId() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any
    if (!user?.branchId) {
      return reply.code(400).send({ 
        message: 'Usuário não vinculado a uma filial.' 
      })
    }
  }
}
```

**Observações:**
- ✅ Verifica se usuário tem `branchId` no token
- ⚠️ Não valida se `branchId` ainda existe no banco
- ⚠️ Não verifica se usuário tem acesso à filial (apenas verifica existência)

---

## 3. Análise de Rotas por Módulo

### 3.1. Autenticação e Registro

#### `POST /public/register`
- **Proteção:** ❌ Pública (sem autenticação)
- **Permissões:** N/A
- **Isolamento:** N/A (cria novo tenant)
- **Observações:** ✅ Correto - endpoint público para registro inicial

#### `POST /public/register/invite`
- **Proteção:** ❌ Pública (sem autenticação)
- **Permissões:** N/A
- **Isolamento:** Valida `inviteToken` que contém `branchId`
- **Observações:** ✅ Correto - valida token do link antes de criar membro

#### `POST /auth/login`
- **Proteção:** ❌ Pública (sem autenticação)
- **Permissões:** N/A
- **Isolamento:** N/A
- **Observações:** ✅ Correto - endpoint público para login

#### `POST /register` (Registro Interno)
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** `members_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` do body contra `branchId` do usuário
- **Evidência:** `backend/src/services/auth/registerService.ts` valida permissões e hierarquia
- **Observações:** ✅ Correto - valida permissões e isolamento

---

### 3.2. Igrejas (Churches)

#### `POST /churches`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado (qualquer)
- **Isolamento:** ✅ Verifica se usuário já tem igreja (`createdByUserId`)
- **Evidência:** `backend/src/controllers/churchController.ts:47-54`
```typescript
const existingChurch = await prisma.church.findFirst({
  where: { createdByUserId: userId },
})
```
- **Observações:** ✅ Correto - idempotente, retorna igreja existente se já criada

#### `GET /churches`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `userBranchId` ou `userId`
- **Evidência:** `backend/src/services/churchService.ts:109-126`
```typescript
if (userBranchId) {
  const branch = await prisma.branch.findUnique({
    where: { id: userBranchId },
    include: { Church: true }
  })
  return branch?.Church ? [branch.Church] : []
}
```
- **Observações:** ✅ Correto - retorna apenas igreja do usuário

#### `GET /churches/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID sem validação de tenant
- **Evidência:** `backend/src/controllers/churchController.ts:309-328`
```typescript
const church = await this.service.getChurchById(id)
if (!church) {
  return reply.code(404).send({ message: 'Igreja não encontrada.' })
}
return reply.send(church)
```
- **Problema:** Não valida se `church.id` pertence ao usuário antes de retornar
- **Risco:** IDOR - usuário pode acessar igreja de outro tenant se souber o ID
- **Severidade:** 🔴 **ALTA** - Dados sensíveis de outras igrejas podem ser expostos

#### `PUT /churches/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** `church_manage` ou ADMINGERAL/ADMINFILIAL ou criador
- **Isolamento:** ✅ Valida `churchId` do usuário contra `church.id`
- **Evidência:** `backend/src/controllers/churchController.ts:360-396`
```typescript
const church = await prisma.church.findUnique({
  where: { id },
  select: { createdByUserId: true },
})
const isCreator = church.createdByUserId === user.userId
if (!isCreator && user.branchId) {
  const branch = await prisma.branch.findUnique({
    where: { id: user.branchId },
  })
  if (!branch || branch.churchId !== id) {
    if (user.role !== 'ADMINGERAL') {
      return reply.code(403).send({ message: 'Você só pode editar sua própria igreja.' })
    }
  }
}
```
- **Observações:** ✅ Correto - valida isolamento antes de atualizar

#### `DELETE /churches/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Valida `churchId` do membro contra `church.id`
- **Evidência:** `backend/src/controllers/churchController.ts:582-584`
```typescript
if (member.Branch.churchId !== id) {
  return reply.status(403).send({ error: 'Você só pode deletar sua própria igreja.' })
}
```
- **Observações:** ✅ Correto - valida isolamento

---

### 3.3. Filiais (Branches)

#### `POST /branches`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Valida `churchId` do body contra `churchId` do usuário
- **Evidência:** `backend/src/services/branchService.ts:38-41`
```typescript
if (creatorMember.Branch.churchId !== churchId) {
  throw new Error('Você não pode criar filiais para outras igrejas')
}
```
- **Observações:** ✅ Correto - valida que `churchId` do body pertence ao usuário

#### `GET /branches`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA** - Retorna todas as filiais sem filtro
- **Evidência:** `backend/src/controllers/branchController.ts:102-104`
```typescript
export async function listBranchesHandler(request: FastifyRequest, reply: FastifyReply) {
  const branches = await getAllBranches();
  return reply.send(branches);
}
```
- **Evidência Service:** `backend/src/services/branchService.ts:52-54`
```typescript
export async function getAllBranches() {
  return prisma.branch.findMany();
}
```
- **Problema:** Não filtra por `churchId` do usuário
- **Risco:** IDOR - usuário pode ver filiais de outras igrejas
- **Severidade:** 🔴 **ALTA** - Expõe dados de outros tenants

#### `DELETE /branches/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole(['ADMINGERAL', 'ADMINFILIAL'])`)
- **Permissões:** ADMINGERAL ou ADMINFILIAL
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID sem validação explícita de tenant
- **Evidência:** `backend/src/controllers/branchController.ts:107-120`
```typescript
const branch = await getBranchById(id);
if (!branch) {
  return reply.status(404).send({ error: 'Filial não encontrada.' });
}
if (branch.isMainBranch) {
  return reply.status(400).send({ error: 'Não é permitido deletar a sede da igreja.' });
}
await deleteBranchById(id);
```
- **Problema:** Não valida se `branch.id` pertence à igreja do usuário antes de deletar
- **Risco:** IDOR - usuário pode deletar filiais de outras igrejas
- **Severidade:** 🔴 **ALTA** - Permite deleção de recursos de outros tenants

---

### 3.4. Membros (Members)

#### `GET /members`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` e `churchId` baseado em role
- **Evidência:** `backend/src/controllers/memberController.ts:39`
```typescript
const members = await findAllMembers(branchId, churchId, userRole, memberId, hasManagePermission)
```
- **Evidência Service:** `backend/src/services/memberService.ts:31-75`
```typescript
if (userRole === 'ADMINGERAL' && churchId) {
  const members = await prisma.member.findMany({
    where: { Branch: { churchId } }
  })
} else if (branchId) {
  const members = await prisma.member.findMany({
    where: { branchId }
  })
}
```
- **Observações:** ✅ Correto - isolamento baseado em role

#### `GET /members/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Valida acesso baseado em role e `branchId`
- **Evidência:** `backend/src/controllers/memberController.ts:76-87`
```typescript
if (currentMember.role === 'ADMINGERAL') {
  if (member.branch.churchId !== currentMember.Branch.churchId) {
    return reply.status(403).send({ error: 'Você só pode visualizar membros da sua igreja' })
  }
} else if (member.branchId !== currentMember.branchId) {
  return reply.status(403).send({ error: 'Você só pode visualizar membros da sua filial' })
}
```
- **Observações:** ✅ Correto - valida isolamento antes de retornar

#### `PUT /members/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL, ADMINFILIAL, ou próprio membro
- **Isolamento:** ✅ Valida via `validateMemberEditPermission()`
- **Evidência:** `backend/src/utils/authorization.ts:141-189`
```typescript
if (editor.role === Role.ADMINGERAL) {
  if (editor.Branch.churchId !== target.Branch.churchId) {
    throw new Error('Você só pode editar membros da sua igreja')
  }
}
```
- **Observações:** ✅ Correto - valida isolamento

#### `PATCH /members/:id/role`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL ou ADMINFILIAL
- **Isolamento:** ✅ Valida via `validateRoleChangePermission()` que chama `validateMemberEditPermission()`
- **Observações:** ✅ Correto - valida isolamento

---

### 3.5. Eventos (Events)

#### `GET /events`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` do usuário
- **Evidência:** `backend/src/routes/eventsRoutes.ts:24-31`
```typescript
const events = await prisma.event.findMany({
  where: { branchId: user.branchId! },
  orderBy: { startDate: 'asc' },
})
```
- **Observações:** ✅ Correto - isolamento aplicado

#### `GET /events/:id`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID sem validação de `branchId`
- **Evidência:** `backend/src/routes/eventsRoutes.ts:63-83`
```typescript
const event = await prisma.event.findUnique({
  where: { id },
  include: { Branch: { select: { name: true, churchId: true } } }
})
if (!event) {
  return reply.status(404).send({ message: 'Evento não encontrado' })
}
return reply.send(event)
```
- **Problema:** Não valida se `event.branchId` pertence ao usuário antes de retornar
- **Risco:** IDOR - usuário pode acessar eventos de outras filiais
- **Severidade:** 🟡 **MÉDIA** - Dados podem ser expostos, mas não críticos

#### `POST /events`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkPermission(['events_manage'])`)
- **Permissões:** `events_manage` ou role admin
- **Isolamento:** ✅ Usa `branchId` do usuário (não aceita do body)
- **Evidência:** `backend/src/routes/eventsRoutes.ts:164`
```typescript
branchId: user.branchId!,
```
- **Observações:** ✅ Correto - não aceita `branchId` do cliente

#### `PUT /events/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkPermission(['events_manage'])`)
- **Permissões:** `events_manage` ou role admin
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID, mas valida `branchId` após buscar
- **Evidência:** `backend/src/routes/eventsRoutes.ts:205-216`
```typescript
const existing = await prisma.event.findUnique({
  where: { id },
  include: { Branch: { select: { id: true, churchId: true } } }
})
if (!existing || !existing.Branch?.churchId) {
  return reply.status(404).send({ message: 'Evento ou filial não encontrada.' })
}
```
- **Problema:** Não valida se `existing.branchId` pertence ao usuário antes de atualizar
- **Risco:** IDOR - usuário pode atualizar eventos de outras filiais
- **Severidade:** 🟡 **MÉDIA** - Permite modificação de dados de outros tenants

#### `DELETE /events/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkPermission(['events_manage'])`)
- **Permissões:** `events_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de deletar
- **Evidência:** `backend/src/routes/eventsRoutes.ts:350-352`
```typescript
if (event.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Você não tem permissão para excluir este evento' })
}
```
- **Observações:** ✅ Correto - valida isolamento

---

### 3.6. Devocionais (Devotionals)

#### `GET /devotionals`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` do usuário
- **Evidência:** `backend/src/services/devotionalService.ts:5-6`
```typescript
const devotionals = await prisma.devotional.findMany({
  where: { branchId },
})
```
- **Observações:** ✅ Correto - isolamento aplicado

#### `GET /devotionals/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID sem validação de `branchId`
- **Evidência:** `backend/src/services/devotionalService.ts:25-45`
```typescript
const devotional = await prisma.devotional.findUnique({
  where: { id },
})
```
- **Problema:** Não valida se `devotional.branchId` pertence ao usuário
- **Risco:** IDOR - usuário pode acessar devocionais de outras filiais
- **Severidade:** 🟡 **MÉDIA** - Dados podem ser expostos

#### `POST /devotionals`
- **Proteção:** ✅ Protegida (`app.authenticate`, `checkPermission(['devotional_manage'])`)
- **Permissões:** `devotional_manage` ou role admin
- **Isolamento:** ✅ Usa `branchId` do usuário
- **Evidência:** `backend/src/controllers/devotionalController.ts:54`
```typescript
branchId: user.branchId,
```
- **Observações:** ✅ Correto

#### `PUT /devotionals/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`, `checkPermission(['devotional_manage'])`)
- **Permissões:** Autor ou `devotional_manage`
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Verifica autor, mas não valida `branchId`
- **Evidência:** `backend/src/controllers/devotionalController.ts:136-150`
```typescript
const existing = await this.service.getById(id, user.memberId)
const authorId = (existing as any).authorId || (existing as any).author?.id
if (authorId !== user.memberId && !hasPermission) {
  return reply.status(403).send({ message: 'Você não tem permissão para editar este devocional.' })
}
```
- **Problema:** Não valida se `existing.branchId` pertence ao usuário
- **Risco:** IDOR - se usuário souber ID de devocional de outra filial, pode editar se for autor
- **Severidade:** 🟡 **BAIXA** - Requer conhecimento do ID e ser autor, mas ainda é vulnerabilidade

#### `DELETE /devotionals/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`, `checkPermission(['devotional_manage'])`)
- **Permissões:** Autor ou `devotional_manage`
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Mesmo problema do PUT
- **Severidade:** 🟡 **BAIXA**

---

### 3.7. Contribuições (Contributions)

#### `GET /contributions`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` do usuário
- **Evidência:** `backend/src/controllers/contributionController.ts:15`
```typescript
const contributions = await this.service.getByBranch(user.branchId)
```
- **Observações:** ✅ Correto

#### `GET /contributions/:id`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Valida `branchId` antes de retornar
- **Evidência:** `backend/src/controllers/contributionController.ts:34-37`
```typescript
if (contribution.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Você não tem permissão para visualizar esta contribuição' })
}
```
- **Observações:** ✅ Correto - valida isolamento

#### `POST /contributions`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `contributions_manage` ou role admin
- **Isolamento:** ✅ Usa `branchId` do usuário
- **Evidência:** `backend/src/controllers/contributionController.ts:84`
```typescript
branchId: user.branchId
```
- **Observações:** ✅ Correto

#### `PUT /contributions/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `contributions_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de atualizar
- **Evidência:** `backend/src/controllers/contributionController.ts:121-123`
```typescript
if (contribution.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Você não tem permissão para alterar esta contribuição' })
}
```
- **Observações:** ✅ Correto

#### `DELETE /contributions/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `contributions_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de deletar
- **Evidência:** `backend/src/controllers/contributionController.ts:216-218`
```typescript
if (contribution.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Você não tem permissão para excluir esta contribuição' })
}
```
- **Observações:** ✅ Correto

---

### 3.8. Finanças (Finances)

#### `GET /finances`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` do usuário
- **Evidência:** `backend/src/services/financeService.ts:46`
```typescript
const where: any = { branchId }
```
- **Observações:** ✅ Correto

#### `GET /finances/:id`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Valida `branchId` na query
- **Evidência:** `backend/src/services/financeService.ts:182-187`
```typescript
return prisma.transaction.findFirst({
  where: { id, branchId },
})
```
- **Observações:** ✅ Correto - usa `findFirst` com `branchId` na cláusula `where`

#### `POST /finances`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `finances_manage` ou role admin
- **Isolamento:** ✅ Usa `branchId` do usuário
- **Evidência:** `backend/src/controllers/financeController.ts:103`
```typescript
branchId: user.branchId
```
- **Observações:** ✅ Correto

#### `PUT /finances/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `finances_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de atualizar
- **Evidência:** `backend/src/services/financeService.ts:273-278`
```typescript
const existing = await prisma.transaction.findFirst({
  where: { id, branchId },
})
```
- **Observações:** ✅ Correto - usa `findFirst` com `branchId`

#### `DELETE /finances/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `finances_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de deletar
- **Evidência:** `backend/src/services/financeService.ts:312-316`
```typescript
const existing = await prisma.transaction.findFirst({
  where: { id, branchId },
})
```
- **Observações:** ✅ Correto

---

### 3.9. Avisos (Notices)

#### `GET /notices`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `branchId` do usuário (via service)
- **Observações:** ✅ Correto

#### `POST /notices`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `members_manage` ou role admin
- **Isolamento:** ✅ Usa `branchId` do usuário (via service)
- **Observações:** ✅ Correto

#### `DELETE /notices/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkBranchId()`, `checkRole`, `checkPermission`)
- **Permissões:** `members_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` (via service)
- **Observações:** ✅ Correto

---

### 3.10. Horários de Culto (Service Schedules)

#### `POST /service-schedules`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole`, `checkPermission`)
- **Permissões:** `church_manage` ou role admin
- **Isolamento:** ⚠️ **PROBLEMA** - Aceita `branchId` do body, mas valida após buscar
- **Evidência:** `backend/src/controllers/serviceScheduleController.ts:29-89`
```typescript
const finalBranchId = bodyData.branchId || user.branchId
const targetBranch = await prisma.branch.findUnique({
  where: { id: finalBranchId },
})
// Valida se pertence à mesma igreja
if (userBranch.churchId !== targetBranch.churchId) {
  return reply.status(403).send({ message: 'Você só pode criar horários para filiais da sua igreja.' })
}
```
- **Problema:** Aceita `branchId` do cliente no body
- **Risco:** Usuário pode especificar `branchId` de outra filial da mesma igreja (se for ADMINGERAL)
- **Severidade:** 🟡 **BAIXA** - Valida que pertence à mesma igreja, mas permite especificar branchId

#### `GET /service-schedules/branch/:branchId`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Valida `branchId` do parâmetro contra `branchId` do usuário
- **Evidência:** `backend/src/controllers/serviceScheduleController.ts:165-186`
```typescript
if (branchId !== user.branchId) {
  const member = await getMemberFromUserId(user.userId || user.id)
  if (!member || member.role !== 'ADMINGERAL') {
    return reply.status(403).send({ message: 'Você só pode visualizar horários da sua própria filial.' })
  }
  // Valida se pertence à mesma igreja
  if (userBranch.churchId !== targetBranch.churchId) {
    return reply.status(403).send({ message: 'Você só pode visualizar horários de filiais da sua igreja.' })
  }
}
```
- **Observações:** ✅ Correto - valida isolamento

#### `GET /service-schedules/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Valida `branchId` antes de retornar
- **Evidência:** `backend/src/controllers/serviceScheduleController.ts:221-228`
```typescript
if (schedule.branchId !== user.branchId) {
  const member = await getMemberFromUserId(user.userId || user.id)
  if (!member || member.role !== 'ADMINGERAL') {
    return reply.status(403).send({ message: 'Você não tem permissão para visualizar este horário.' })
  }
}
```
- **Observações:** ✅ Correto - valida isolamento

#### `PUT /service-schedules/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole`, `checkPermission`)
- **Permissões:** `church_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de atualizar
- **Evidência:** `backend/src/controllers/serviceScheduleController.ts:262-268`
```typescript
if (schedule.branchId !== user.branchId) {
  const member = await getMemberFromUserId(user.userId || user.id)
  if (!member || member.role !== 'ADMINGERAL') {
    return reply.status(403).send({ message: 'Você não tem permissão para editar este horário.' })
  }
}
```
- **Observações:** ✅ Correto

#### `DELETE /service-schedules/:id`
- **Proteção:** ✅ Protegida (`authenticate`, `checkRole`, `checkPermission`)
- **Permissões:** `church_manage` ou role admin
- **Isolamento:** ✅ Valida `branchId` antes de deletar
- **Observações:** ✅ Correto

---

### 3.11. Cargos (Positions)

#### `GET /positions`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Filtra por `churchId` do membro
- **Evidência:** `backend/src/controllers/positionController.ts:30-35`
```typescript
const churchId = member.Branch.churchId
const positions = await positionService.getAllPositions(churchId)
```
- **Observações:** ✅ Correto

#### `POST /positions`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Usa `churchId` do membro
- **Evidência:** `backend/src/controllers/positionController.ts:60-62`
```typescript
const churchId = member.Branch.churchId
const position = await positionService.createPosition(churchId, data.name, false)
```
- **Observações:** ✅ Correto

#### `PUT /positions/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Valida `churchId` antes de atualizar
- **Evidência:** `backend/src/controllers/positionController.ts:103-105`
```typescript
if (position.churchId !== member.Branch.churchId) {
  return reply.status(403).send({ error: 'Você só pode editar cargos da sua igreja' })
}
```
- **Observações:** ✅ Correto

#### `DELETE /positions/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Valida `churchId` antes de deletar
- **Evidência:** `backend/src/controllers/positionController.ts:152-154`
```typescript
if (position.churchId !== member.Branch.churchId) {
  return reply.status(403).send({ error: 'Você só pode deletar cargos da sua igreja' })
}
```
- **Observações:** ✅ Correto

---

### 3.12. Permissões (Permissions)

#### `GET /permissions/all`
- **Proteção:** ✅ Protegida (`app.authenticate`, `checkRole`)
- **Permissões:** ADMINGERAL, ADMINFILIAL, COORDINATOR
- **Isolamento:** N/A (lista global de tipos de permissão)
- **Observações:** ✅ Correto - não é dados de tenant

#### `POST /permissions/:id`
- **Proteção:** ✅ Protegida (`app.authenticate`, `checkRole(['ADMINGERAL', 'ADMINFILIAL'])`)
- **Permissões:** ADMINGERAL ou ADMINFILIAL
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca membro por ID sem validação explícita de tenant
- **Evidência:** `backend/src/controllers/auth/permissionsController.ts:54-57`
```typescript
const member = await prisma.member.findUnique({
  where: { id },
  select: { id: true, role: true },
})
```
- **Problema:** Não valida se `member.id` pertence à igreja/filial do usuário antes de atribuir permissões
- **Risco:** IDOR - usuário pode atribuir permissões a membros de outras igrejas
- **Severidade:** 🔴 **ALTA** - Permite modificar permissões de outros tenants

---

### 3.13. Links de Convite (Invite Links)

#### `POST /invite-links`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** `members_manage` ou role admin
- **Isolamento:** ⚠️ **PROBLEMA** - Aceita `branchId` do body
- **Evidência:** `backend/src/controllers/inviteLinkController.ts:24-49`
```typescript
const bodySchema = z.object({
  branchId: z.string().cuid(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})
```
- **Problema:** Aceita `branchId` do cliente sem validação explícita de que pertence ao usuário
- **Risco:** Usuário pode criar links de convite para outras filiais se souber o `branchId`
- **Severidade:** 🟡 **MÉDIA** - Service pode validar, mas não está claro no controller

#### `GET /invite-links/branch/:branchId`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Aceita `branchId` do parâmetro
- **Evidência:** `backend/src/controllers/inviteLinkController.ts:172`
```typescript
const { branchId } = paramsSchema.parse(request.params)
const links = await getAllLinksByBranch(branchId, userId)
```
- **Problema:** Aceita `branchId` do parâmetro sem validação explícita
- **Risco:** Usuário pode listar links de outras filiais se souber o `branchId`
- **Severidade:** 🟡 **MÉDIA** - Service pode validar, mas não está claro

#### `PATCH /invite-links/:id/deactivate`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Busca por ID sem validação explícita
- **Evidência:** `backend/src/controllers/inviteLinkController.ts:212`
```typescript
const deactivatedLink = await deactivateInviteLink(id, userId)
```
- **Problema:** Service pode validar, mas não está claro no controller
- **Severidade:** 🟡 **BAIXA** - Service provavelmente valida

---

### 3.14. Onboarding

#### `GET /onboarding/state`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Escopo `userId` (não é multi-tenant)
- **Observações:** ✅ Correto

#### `POST /onboarding/complete`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Escopo `userId`
- **Observações:** ✅ Correto

---

### 3.15. Assinaturas e Planos

#### `GET /subscriptions/me`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Escopo `userId`
- **Observações:** ✅ Correto

#### `GET /plans`
- **Proteção:** ✅ Protegida (`authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** N/A (planos são globais)
- **Observações:** ✅ Correto

---

### 3.16. Upload

#### `POST /upload/avatar`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ✅ Escopo `userId`
- **Observações:** ✅ Correto

#### `POST /upload/church-avatar`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** User autenticado
- **Isolamento:** ⚠️ **PROBLEMA POTENCIAL** - Não valida se usuário tem acesso à igreja
- **Severidade:** 🟡 **BAIXA** - Upload de avatar não é crítico, mas deveria validar

---

### 3.17. Auditoria

#### `GET /audit`
- **Proteção:** ✅ Protegida (`app.authenticate`)
- **Permissões:** ADMINGERAL apenas
- **Isolamento:** ✅ Filtra por `churchId` do usuário
- **Evidência:** `backend/src/controllers/auditController.ts:28-30`
```typescript
if (currentMember.role !== 'ADMINGERAL') {
  return reply.status(403).send({ error: 'Apenas Administradores Gerais podem visualizar logs de auditoria' })
}
```
- **Observações:** ✅ Correto - apenas ADMINGERAL pode ver logs da sua igreja

---

## 4. Vulnerabilidades Identificadas

### 4.1. Vulnerabilidades de Alta Severidade (🔴)

#### VULN-001: `GET /churches/:id` - IDOR
- **Rota:** `GET /churches/:id`
- **Arquivo:** `backend/src/controllers/churchController.ts:309-328`
- **Problema:** Busca igreja por ID sem validar se pertence ao usuário
- **Impacto:** Usuário pode acessar dados de outras igrejas se souber o ID
- **Evidência:**
```typescript
const church = await this.service.getChurchById(id)
if (!church) {
  return reply.code(404).send({ message: 'Igreja não encontrada.' })
}
return reply.send(church) // ❌ Não valida se church pertence ao usuário
```
- **Recomendação:** Adicionar validação de `churchId` antes de retornar

#### VULN-002: `GET /branches` - Exposição de Dados
- **Rota:** `GET /branches`
- **Arquivo:** `backend/src/controllers/branchController.ts:102-104`
- **Problema:** Retorna todas as filiais sem filtrar por `churchId`
- **Impacto:** Usuário pode ver filiais de outras igrejas
- **Evidência:**
```typescript
export async function listBranchesHandler(request: FastifyRequest, reply: FastifyReply) {
  const branches = await getAllBranches(); // ❌ Retorna todas as filiais
  return reply.send(branches);
}
```
- **Recomendação:** Filtrar por `churchId` do usuário

#### VULN-003: `DELETE /branches/:id` - IDOR
- **Rota:** `DELETE /branches/:id`
- **Arquivo:** `backend/src/controllers/branchController.ts:107-120`
- **Problema:** Busca filial por ID sem validar se pertence à igreja do usuário
- **Impacto:** Usuário pode deletar filiais de outras igrejas
- **Evidência:**
```typescript
const branch = await getBranchById(id);
if (!branch) {
  return reply.status(404).send({ error: 'Filial não encontrada.' });
}
await deleteBranchById(id); // ❌ Não valida se branch pertence à igreja do usuário
```
- **Recomendação:** Adicionar validação de `churchId` antes de deletar

#### VULN-004: `POST /permissions/:id` - IDOR
- **Rota:** `POST /permissions/:id`
- **Arquivo:** `backend/src/controllers/auth/permissionsController.ts:54-63`
- **Problema:** Busca membro por ID sem validar se pertence à igreja/filial do usuário
- **Impacto:** Usuário pode atribuir permissões a membros de outras igrejas
- **Evidência:**
```typescript
const member = await prisma.member.findUnique({
  where: { id },
  select: { id: true, role: true },
})
// ❌ Não valida se member pertence à igreja/filial do usuário
```
- **Recomendação:** Adicionar validação de `churchId`/`branchId` antes de atribuir permissões

---

### 4.2. Vulnerabilidades de Média Severidade (🟡)

#### VULN-005: `GET /events/:id` - IDOR
- **Rota:** `GET /events/:id`
- **Arquivo:** `backend/src/routes/eventsRoutes.ts:63-83`
- **Problema:** Busca evento por ID sem validar `branchId`
- **Impacto:** Usuário pode acessar eventos de outras filiais
- **Recomendação:** Adicionar validação de `branchId` antes de retornar

#### VULN-006: `PUT /events/:id` - IDOR
- **Rota:** `PUT /events/:id`
- **Arquivo:** `backend/src/routes/eventsRoutes.ts:205-216`
- **Problema:** Busca evento por ID, mas não valida `branchId` antes de atualizar
- **Impacto:** Usuário pode atualizar eventos de outras filiais
- **Recomendação:** Adicionar validação de `branchId` antes de atualizar

#### VULN-007: `GET /devotionals/:id` - IDOR
- **Rota:** `GET /devotionals/:id`
- **Arquivo:** `backend/src/services/devotionalService.ts:25-45`
- **Problema:** Busca devocional por ID sem validar `branchId`
- **Impacto:** Usuário pode acessar devocionais de outras filiais
- **Recomendação:** Adicionar validação de `branchId` no service

#### VULN-008: `PUT /devotionals/:id` - IDOR
- **Rota:** `PUT /devotionals/:id`
- **Arquivo:** `backend/src/controllers/devotionalController.ts:136-150`
- **Problema:** Verifica autor, mas não valida `branchId`
- **Impacto:** Autor de devocional de outra filial pode editar
- **Recomendação:** Adicionar validação de `branchId`

#### VULN-009: `POST /invite-links` - Aceita branchId do Cliente
- **Rota:** `POST /invite-links`
- **Arquivo:** `backend/src/controllers/inviteLinkController.ts:24-49`
- **Problema:** Aceita `branchId` do body sem validação explícita
- **Impacto:** Usuário pode criar links para outras filiais
- **Recomendação:** Validar que `branchId` pertence à igreja do usuário

#### VULN-010: `GET /invite-links/branch/:branchId` - Aceita branchId do Cliente
- **Rota:** `GET /invite-links/branch/:branchId`
- **Arquivo:** `backend/src/controllers/inviteLinkController.ts:172`
- **Problema:** Aceita `branchId` do parâmetro sem validação explícita
- **Impacto:** Usuário pode listar links de outras filiais
- **Recomendação:** Validar que `branchId` pertence à igreja do usuário

#### VULN-011: `POST /service-schedules` - Aceita branchId do Cliente
- **Rota:** `POST /service-schedules`
- **Arquivo:** `backend/src/controllers/serviceScheduleController.ts:29-89`
- **Problema:** Aceita `branchId` do body (com validação de igreja, mas permite especificar)
- **Impacto:** ADMINGERAL pode criar horários para qualquer filial da igreja
- **Severidade:** 🟢 **BAIXA** - Valida que pertence à mesma igreja, comportamento pode ser intencional
- **Observação:** Pode ser comportamento desejado (ADMINGERAL pode gerenciar todas as filiais)

---

### 4.3. Vulnerabilidades de Baixa Severidade (🟢)

#### VULN-012: `POST /upload/church-avatar` - Sem Validação de Acesso
- **Rota:** `POST /upload/church-avatar`
- **Problema:** Não valida se usuário tem acesso à igreja
- **Impacto:** Usuário pode fazer upload de avatar para igreja que não possui
- **Severidade:** 🟢 **BAIXA** - Upload de avatar não é crítico

---

## 5. Padrões de Isolamento Identificados

### 5.1. Padrão Correto: Filtro na Query Prisma

**Exemplo:** `GET /events`
```typescript
const events = await prisma.event.findMany({
  where: { branchId: user.branchId! },
})
```

**Vantagem:** Isolamento aplicado diretamente na query, impossível bypass

---

### 5.2. Padrão Correto: Validação Antes de Operação

**Exemplo:** `DELETE /events/:id`
```typescript
const event = await prisma.event.findUnique({ where: { id } })
if (event.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Você não tem permissão...' })
}
await prisma.event.delete({ where: { id } })
```

**Vantagem:** Valida isolamento antes de executar operação

---

### 5.3. Padrão Correto: findFirst com branchId

**Exemplo:** `GET /finances/:id`
```typescript
return prisma.transaction.findFirst({
  where: { id, branchId },
})
```

**Vantagem:** Combina ID e branchId na query, impossível acessar de outro tenant

---

### 5.4. Padrão Problemático: findUnique sem branchId

**Exemplo:** `GET /churches/:id` (VULN-001)
```typescript
const church = await prisma.church.findUnique({
  where: { id },
})
return reply.send(church) // ❌ Não valida tenant
```

**Problema:** Busca por ID sem validar tenant, permite IDOR

---

### 5.5. Padrão Problemático: Aceitar Tenant ID do Cliente

**Exemplo:** `POST /invite-links` (VULN-009)
```typescript
const bodySchema = z.object({
  branchId: z.string().cuid(), // ❌ Aceita do cliente
})
```

**Problema:** Permite que cliente especifique tenant ID sem validação adequada

---

## 6. Recomendações

### 6.1. Correções Imediatas (Alta Prioridade)

1. **Corrigir VULN-001:** Adicionar validação de `churchId` em `GET /churches/:id`
2. **Corrigir VULN-002:** Filtrar `GET /branches` por `churchId` do usuário
3. **Corrigir VULN-003:** Adicionar validação de `churchId` em `DELETE /branches/:id`
4. **Corrigir VULN-004:** Adicionar validação de `churchId`/`branchId` em `POST /permissions/:id`

### 6.2. Correções de Média Prioridade

5. **Corrigir VULN-005:** Adicionar validação de `branchId` em `GET /events/:id`
6. **Corrigir VULN-006:** Adicionar validação de `branchId` em `PUT /events/:id`
7. **Corrigir VULN-007:** Adicionar validação de `branchId` em `GET /devotionals/:id`
8. **Corrigir VULN-008:** Adicionar validação de `branchId` em `PUT /devotionals/:id`
9. **Corrigir VULN-009:** Validar `branchId` em `POST /invite-links`
10. **Corrigir VULN-010:** Validar `branchId` em `GET /invite-links/branch/:branchId`

### 6.3. Melhorias de Segurança

11. **Padronizar Validação de Tenant:** Criar helper `validateTenantAccess(entityId, user)` para reutilização
12. **Usar findFirst ao invés de findUnique:** Quando possível, usar `findFirst({ where: { id, branchId } })` ao invés de `findUnique({ where: { id } })`
13. **Validar branchId no Token:** Adicionar validação periódica de que `branchId` do token ainda existe no banco
14. **Log de Tentativas de Acesso Não Autorizado:** Adicionar logs de auditoria para tentativas de acesso a recursos de outros tenants

---

## 7. Resumo de Rotas por Status de Segurança

### ✅ Rotas Seguras (Isolamento Aplicado Corretamente)

- `POST /churches` - Valida `createdByUserId`
- `GET /churches` - Filtra por `userBranchId`
- `PUT /churches/:id` - Valida `churchId`
- `DELETE /churches/:id` - Valida `churchId`
- `GET /members` - Filtra por `branchId`/`churchId` baseado em role
- `GET /members/:id` - Valida acesso baseado em role
- `PUT /members/:id` - Valida via `validateMemberEditPermission()`
- `PATCH /members/:id/role` - Valida via `validateRoleChangePermission()`
- `GET /events` - Filtra por `branchId`
- `POST /events` - Usa `branchId` do usuário
- `DELETE /events/:id` - Valida `branchId`
- `GET /devotionals` - Filtra por `branchId`
- `POST /devotionals` - Usa `branchId` do usuário
- `GET /contributions` - Filtra por `branchId`
- `GET /contributions/:id` - Valida `branchId`
- `POST /contributions` - Usa `branchId` do usuário
- `PUT /contributions/:id` - Valida `branchId`
- `DELETE /contributions/:id` - Valida `branchId`
- `GET /finances` - Filtra por `branchId`
- `GET /finances/:id` - Usa `findFirst` com `branchId`
- `POST /finances` - Usa `branchId` do usuário
- `PUT /finances/:id` - Valida `branchId`
- `DELETE /finances/:id` - Valida `branchId`
- `GET /positions` - Filtra por `churchId`
- `POST /positions` - Usa `churchId` do membro
- `PUT /positions/:id` - Valida `churchId`
- `DELETE /positions/:id` - Valida `churchId`
- `GET /service-schedules/branch/:branchId` - Valida `branchId`
- `GET /service-schedules/:id` - Valida `branchId`
- `PUT /service-schedules/:id` - Valida `branchId`
- `DELETE /service-schedules/:id` - Valida `branchId`

### ⚠️ Rotas com Problemas de Segurança

#### 🔴 Alta Severidade
- `GET /churches/:id` - VULN-001: IDOR
- `GET /branches` - VULN-002: Expõe dados de outros tenants
- `DELETE /branches/:id` - VULN-003: IDOR
- `POST /permissions/:id` - VULN-004: IDOR

#### 🟡 Média Severidade
- `GET /events/:id` - VULN-005: IDOR
- `PUT /events/:id` - VULN-006: IDOR
- `GET /devotionals/:id` - VULN-007: IDOR
- `PUT /devotionals/:id` - VULN-008: IDOR
- `DELETE /devotionals/:id` - IDOR (mesmo problema do PUT)
- `POST /invite-links` - VULN-009: Aceita `branchId` do cliente
- `GET /invite-links/branch/:branchId` - VULN-010: Aceita `branchId` do cliente
- `POST /service-schedules` - VULN-011: Aceita `branchId` do cliente (pode ser intencional)

#### 🟢 Baixa Severidade
- `POST /upload/church-avatar` - VULN-012: Sem validação de acesso

---

## 8. Padrões de Validação Recomendados

### 8.1. Para Recursos com Escopo `branchId`

**Padrão Recomendado:**
```typescript
// Opção 1: findFirst com branchId (melhor)
const resource = await prisma.resource.findFirst({
  where: { id, branchId: user.branchId },
})

// Opção 2: findUnique + validação
const resource = await prisma.resource.findUnique({ where: { id } })
if (!resource || resource.branchId !== user.branchId) {
  return reply.status(403).send({ message: 'Acesso negado' })
}
```

### 8.2. Para Recursos com Escopo `churchId`

**Padrão Recomendado:**
```typescript
// Buscar churchId do usuário primeiro
const member = await getMemberFromUserId(user.userId)
if (!member?.Branch) {
  return reply.status(400).send({ error: 'Membro não encontrado' })
}
const userChurchId = member.Branch.churchId

// Validar resource
const resource = await prisma.resource.findUnique({ where: { id } })
if (!resource || resource.churchId !== userChurchId) {
  return reply.status(403).send({ message: 'Acesso negado' })
}
```

### 8.3. Para Rotas que Aceitam Tenant ID do Cliente

**Padrão Recomendado:**
```typescript
// NUNCA aceitar branchId/churchId do cliente sem validação
const bodyBranchId = request.body.branchId
if (bodyBranchId && bodyBranchId !== user.branchId) {
  // Se for ADMINGERAL, validar que pertence à mesma igreja
  if (user.role !== 'ADMINGERAL') {
    return reply.status(403).send({ message: 'Você só pode acessar sua própria filial' })
  }
  // Validar que branchId pertence à mesma igreja
  const targetBranch = await prisma.branch.findUnique({ where: { id: bodyBranchId } })
  const userBranch = await prisma.branch.findUnique({ where: { id: user.branchId } })
  if (!targetBranch || targetBranch.churchId !== userBranch.churchId) {
    return reply.status(403).send({ message: 'Acesso negado' })
  }
}
```

---

## 9. Checklist de Validação de Segurança

Para cada nova rota ou modificação de rota existente, verificar:

- [ ] Rota é pública ou protegida?
- [ ] Se protegida, qual middleware de autenticação é usado?
- [ ] Quais permissões/roles são necessárias?
- [ ] Como o isolamento de tenant é aplicado?
  - [ ] Filtro na query Prisma (`where: { branchId: user.branchId }`)
  - [ ] Validação antes de operação (`if (resource.branchId !== user.branchId)`)
  - [ ] Uso de `findFirst` com `branchId` ao invés de `findUnique`
- [ ] A rota aceita `branchId`/`churchId` do cliente?
  - [ ] Se sim, valida que pertence ao usuário?
  - [ ] Se sim, valida hierarquia (ADMINGERAL pode acessar outras filiais da mesma igreja)?
- [ ] Testes de segurança cobrem:
  - [ ] Tentativa de acesso a recurso de outro tenant
  - [ ] Tentativa de especificar `branchId`/`churchId` inválido
  - [ ] Tentativa de acesso sem permissão adequada

---

## 10. Conclusão

### Pontos Positivos ✅

1. **Maioria das rotas aplica isolamento corretamente** - Filtros por `branchId`/`churchId` são aplicados na maioria dos casos
2. **Permissões são verificadas no banco** - `checkPermission` busca permissões atualizadas do banco, não confia apenas no token
3. **Validação de hierarquia** - Funções como `validateMemberEditPermission()` validam corretamente isolamento baseado em role
4. **Uso de `findFirst` com `branchId`** - Alguns serviços usam `findFirst({ where: { id, branchId } })` que é mais seguro

### Pontos de Atenção ⚠️

1. **4 rotas com IDOR de alta severidade** - Precisam correção imediata
2. **7 rotas com IDOR de média severidade** - Precisam correção
3. **Rotas que aceitam tenant IDs do cliente** - Precisam validação explícita
4. **Falta padronização** - Algumas rotas usam padrões diferentes para validação

### Recomendações Prioritárias

1. **Corrigir 4 vulnerabilidades de alta severidade** (VULN-001 a VULN-004)
2. **Criar helper reutilizável** para validação de acesso a recursos (`validateResourceAccess()`)
3. **Padronizar uso de `findFirst`** ao invés de `findUnique` quando possível
4. **Adicionar testes de segurança** para todas as rotas identificadas como vulneráveis

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de Segurança  
**Versão:** 1.0

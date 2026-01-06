# Backend — Funções e middlewares “públicos” (uso interno)

Esta página documenta exports reutilizados entre módulos do backend (middlewares e helpers). Eles não são “públicos” para consumidores HTTP, mas são a **API interna** para quem desenvolve rotas/serviços.

## Middlewares (Fastify)

Origem: `backend/src/middlewares/*`.

### `authenticate(request, reply)`

- Arquivo: `backend/src/middlewares/authenticate.ts`
- Responsabilidade: valida `Authorization: Bearer <token>` e popula `request.user` com:
  - `id`, `userId`, `email`, `type`, `permissions`, `role`, `branchId`, `memberId`, `churchId`
- Erros:
  - `401 { message: 'Token ausente' }`
  - `401 { message: 'Token inválido' }`

Uso:

```ts
app.get('/minha-rota', { preHandler: [authenticate] }, async (req, reply) => {
  // req.user estará populado
  return reply.send({ ok: true })
})
```

### `authorize(allowedRoles)`

- Arquivo: `backend/src/middlewares/authorize.ts`
- Responsabilidade: valida `request.user.role` ∈ `allowedRoles`.
- Erro: `403 { error: 'Acesso não autorizado' }`

Uso:

```ts
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

app.post('/admin-only', { preHandler: [authenticate, authorize(['SAAS_ADMIN'])] }, handler)
```

### `checkRole(required)`

- Arquivo: `backend/src/middlewares/checkRole.ts`
- Responsabilidade: valida `request.user.role` (do token) ∈ `required`.
- Erro: `403 { message: 'Acesso negado: Role insuficiente…' }`

### `checkPermission(requiredPermissions)`

- Arquivo: `backend/src/middlewares/checkPermission.ts`
- Responsabilidade:
  - ADMINGERAL/ADMINFILIAL passam automaticamente
  - demais roles: busca permissões atualizadas no banco via `prisma.member.Permission` (fallback: permissões do token)
  - exige **todas** as permissões em `requiredPermissions`
- Erro: `403 { message: 'Acesso negado: Permissão insuficiente…' }`

### `checkBranchId()`

- Arquivo: `backend/src/middlewares/checkBranchId.ts`
- Responsabilidade: garante que `request.user.branchId` existe (útil antes de `checkPermission`)
- Erro: `400 { message: 'Usuário não vinculado a uma filial.' }`

### Admin middlewares

#### `adminAuthenticate(request, reply)`

- Arquivo: `backend/src/middlewares/adminAuthenticate.ts`
- Responsabilidade: valida token de **admin** (`payload.type === 'admin'`) e popula `request.adminUser`.

#### `requireAdminRole(allowedRoles)`

- Arquivo: `backend/src/middlewares/adminAuthorize.ts`
- Responsabilidade: valida `request.adminUser.adminRole`.

---

## Funções utilitárias

### Auditoria (`backend/src/utils/auditHelper.ts`)

Exports:

- `getAuditContext(request, fallbackUserId?, fallbackEmail?)`
- `logAudit(request, action, entityType, description, options?)`
- `AuditLogger` (helpers prontos, ex.: `memberCreated`, `branchCreated`, `planLimitExceeded`, etc.)

Uso típico:

```ts
import { AuditLogger } from '../utils/auditHelper'

await AuditLogger.memberCreated(request, member.id, member.email, member.role, member.branchId)
```

### Limites de plano (`backend/src/utils/planLimits.ts`)

Exports:

- `checkPlanMembersLimit(userId)` → lança erro se excedeu `Plan.maxMembers`
- `checkPlanBranchesLimit(userId)` → lança erro se excedeu `Plan.maxBranches`

Uso típico (antes de criar membro/filial):

```ts
import { checkPlanMembersLimit } from '../utils/planLimits'

await checkPlanMembersLimit(request.user.userId)
```

### Autorização por regras (membros) (`backend/src/utils/authorization.ts`)

Exports principais:

- `getMemberFromUserId(userId)`
- `validateMemberCreationPermission(creatorMemberId, targetBranchId, targetRole?)`
- `validateMemberEditPermission(editorMemberId, targetMemberId)`
- `validateRoleHierarchy(creatorRole, targetRole)`
- `validatePositionChangePermission(editorMemberId, targetMemberId, editorRole, editorPermissions)`
- `validateRoleChangePermission(editorMemberId, targetMemberId, newRole)`
- `hasAccess(memberWithPermission, permission)`

Essas funções centralizam regras como:

- isolamento por igreja/filial
- hierarquia de roles (ex.: impedir criação de `ADMINGERAL`)
- permissões granulares (ex.: `members_manage`)

### Utilitários simples de usuário (`backend/src/utils/userUtils.ts`)

Exports:

- `getUserFullName(user)` → concatena `firstName` + `lastName` com fallback seguro.


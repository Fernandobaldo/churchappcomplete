# 📋 Sistema de Auditoria Implementado - ChurchPulse

## 🎯 Visão Geral

Sistema completo de auditoria que registra todas as ações administrativas importantes do sistema, permitindo rastreabilidade e conformidade.

---

## 📊 Modelo de Dados

### AuditLog

**Localização**: `backend/prisma/schema.prisma`

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String      // 'Member', 'Branch', 'Church', etc.
  entityId    String?     // ID da entidade afetada
  userId      String      // ID do usuário que realizou a ação
  userEmail   String      // Email do usuário
  userRole    String?     // Role do usuário no momento
  description String      // Descrição da ação
  metadata    Json?       // Dados adicionais (antes/depois, etc.)
  ipAddress   String?     // IP de origem
  userAgent   String?     // User agent
  createdAt   DateTime    @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
```

### AuditAction (Enum)

```prisma
enum AuditAction {
  MEMBER_CREATED
  MEMBER_UPDATED
  MEMBER_DELETED
  MEMBER_ROLE_CHANGED
  MEMBER_PERMISSIONS_CHANGED
  BRANCH_CREATED
  BRANCH_UPDATED
  BRANCH_DELETED
  CHURCH_CREATED
  CHURCH_UPDATED
  CHURCH_DELETED
  PERMISSION_GRANTED
  PERMISSION_REVOKED
  LOGIN
  LOGOUT
  PLAN_LIMIT_EXCEEDED
  UNAUTHORIZED_ACCESS_ATTEMPT
}
```

---

## 🔧 Serviços e Utilitários

### auditService.ts

**Localização**: `backend/src/services/auditService.ts`

#### Funções Principais:

- `createAuditLog(data)`: Cria um log de auditoria
- `getAuditLogs(filters)`: Busca logs com filtros
- `getMemberAuditLogs(memberId)`: Logs de um membro específico
- `getBranchAuditLogs(branchId)`: Logs de uma filial específica
- `getChurchAuditLogs(churchId)`: Logs de uma igreja específica
- `getUserAuditLogs(userId)`: Logs de um usuário específico

### auditHelper.ts

**Localização**: `backend/src/utils/auditHelper.ts`

#### Funções Auxiliares:

- `getAuditContext(request)`: Obtém contexto da requisição (IP, User Agent, etc.)
- `logAudit(request, action, entityType, description, options)`: Cria log simplificado
- `AuditLogger`: Objeto com métodos pré-configurados:
  - `memberCreated()`
  - `memberUpdated()`
  - `memberRoleChanged()`
  - `memberPermissionsChanged()`
  - `branchCreated()`
  - `churchCreated()`
  - `unauthorizedAccessAttempt()`
  - `planLimitExceeded()`

---

## 📝 Ações Auditadas

### Membros

- ✅ **MEMBER_CREATED**: Quando um membro é criado
- ✅ **MEMBER_UPDATED**: Quando um membro é atualizado
- ✅ **MEMBER_ROLE_CHANGED**: Quando o role de um membro é alterado
- ✅ **MEMBER_PERMISSIONS_CHANGED**: Quando permissões são atribuídas/removidas

### Filiais

- ✅ **BRANCH_CREATED**: Quando uma filial é criada
- ✅ **BRANCH_DELETED**: Quando uma filial é deletada

### Igrejas

- ✅ **CHURCH_CREATED**: Quando uma igreja é criada

### Segurança

- ✅ **LOGIN**: Quando um usuário faz login
- ✅ **UNAUTHORIZED_ACCESS_ATTEMPT**: Tentativas de acesso não autorizado
- ✅ **PLAN_LIMIT_EXCEEDED**: Quando limite de plano é excedido

---

## 🔌 Endpoints de Auditoria

### `GET /audit`

**Descrição**: Lista logs de auditoria com filtros

**Acesso**: Apenas ADMINGERAL

**Query Parameters**:
- `userId` (opcional): Filtrar por usuário
- `entityType` (opcional): Filtrar por tipo (Member, Branch, Church, etc.)
- `entityId` (opcional): Filtrar por ID da entidade
- `action` (opcional): Filtrar por ação
- `startDate` (opcional): Data inicial (ISO string)
- `endDate` (opcional): Data final (ISO string)
- `limit` (opcional): Limite de resultados (padrão: 100, máximo: 1000)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response**:
```json
{
  "logs": [
    {
      "id": "log-123",
      "action": "MEMBER_CREATED",
      "entityType": "Member",
      "entityId": "member-123",
      "userId": "user-123",
      "userEmail": "admin@example.com",
      "userRole": "ADMINGERAL",
      "description": "Membro criado: joao@example.com com role MEMBER",
      "metadata": {
        "memberEmail": "joao@example.com",
        "role": "MEMBER",
        "branchId": "branch-123"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### `GET /audit/members/:id`

**Descrição**: Lista logs de um membro específico

**Acesso**: 
- ADMINGERAL: Qualquer membro da igreja
- Outros: Apenas seus próprios logs

### `GET /audit/branches/:id`

**Descrição**: Lista logs de uma filial específica

**Acesso**: Apenas ADMINGERAL

### `GET /audit/me`

**Descrição**: Lista logs do usuário autenticado

**Acesso**: Qualquer usuário autenticado

---

## 🔍 Onde os Logs são Criados

### Controllers

1. **registerController** (`backend/src/controllers/auth/registerController.ts`):
   - ✅ Log de criação de membro
   - ✅ Log de tentativa não autorizada
   - ✅ Log de limite excedido

2. **memberController** (`backend/src/controllers/memberController.ts`):
   - ✅ Log de atualização de membro

3. **branchController** (`backend/src/controllers/branchController.ts`):
   - ✅ Log de criação de branch
   - ✅ Log de tentativa não autorizada
   - ✅ Log de limite excedido

4. **churchController** (`backend/src/controllers/churchController.ts`):
   - ✅ Log de criação de igreja

5. **permissionsController** (`backend/src/controllers/auth/permissionsController.ts`):
   - ✅ Log de mudança de permissões

6. **authController** (`backend/src/controllers/authController.ts`):
   - ✅ Log de login
   - ✅ Log de tentativa de login falhada

---

## 📊 Exemplo de Log

```json
{
  "id": "clx1234567890",
  "action": "MEMBER_CREATED",
  "entityType": "Member",
  "entityId": "member-abc123",
  "userId": "user-xyz789",
  "userEmail": "admin@example.com",
  "userRole": "ADMINGERAL",
  "description": "Membro criado: joao@example.com com role MEMBER",
  "metadata": {
    "memberEmail": "joao@example.com",
    "role": "MEMBER",
    "branchId": "branch-123"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "createdAt": "2025-01-27T14:30:00.000Z"
}
```

---

## 🚀 Como Usar

### 1. Criar Migration

```bash
cd backend
npx prisma migrate dev --name add_audit_log
```

### 2. Consultar Logs

```bash
# Listar todos os logs (ADMINGERAL)
GET /audit
Authorization: Bearer <token>

# Filtrar por ação
GET /audit?action=MEMBER_CREATED

# Filtrar por período
GET /audit?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z

# Logs de um membro específico
GET /audit/members/member-123

# Meus logs
GET /audit/me
```

---

## 🔐 Segurança e Privacidade

### Regras de Acesso

1. **ADMINGERAL**: 
   - ✅ Pode ver todos os logs da igreja
   - ✅ Pode filtrar por qualquer critério

2. **ADMINFILIAL/COORDINATOR/MEMBER**:
   - ✅ Podem ver apenas seus próprios logs (`/audit/me`)
   - ❌ Não podem ver logs de outros usuários

### Dados Sensíveis

- **Senhas**: Nunca são registradas nos logs
- **IP Address**: Registrado para segurança (pode ser desabilitado)
- **User Agent**: Registrado para análise (pode ser desabilitado)

---

## 📈 Casos de Uso

### 1. Rastreamento de Mudanças

```bash
# Ver todas as mudanças em um membro
GET /audit/members/member-123
```

### 2. Auditoria de Segurança

```bash
# Ver tentativas não autorizadas
GET /audit?action=UNAUTHORIZED_ACCESS_ATTEMPT
```

### 3. Análise de Uso

```bash
# Ver logins do dia
GET /audit?action=LOGIN&startDate=2025-01-27T00:00:00Z
```

### 4. Conformidade

```bash
# Exportar todos os logs de um período
GET /audit?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z&limit=1000
```

---

## ✅ Checklist de Implementação

- [x] Modelo AuditLog no Prisma
- [x] Enum AuditAction
- [x] Serviço de auditoria (auditService.ts)
- [x] Utilitários de auditoria (auditHelper.ts)
- [x] Logs na criação de membros
- [x] Logs na atualização de membros
- [x] Logs na criação de branches
- [x] Logs na criação de igrejas
- [x] Logs na atribuição de permissões
- [x] Logs de login
- [x] Logs de tentativas não autorizadas
- [x] Logs de limites excedidos
- [x] Endpoints para consultar logs
- [x] Validações de acesso aos logs
- [x] Documentação Swagger

---

## 🔄 Próximos Passos

1. **Criar Migration**: Executar `npx prisma migrate dev`
2. **Adicionar mais logs**: Eventos, devocionais, contribuições
3. **Dashboard de Auditoria**: Interface visual para análise
4. **Alertas**: Notificações para ações críticas
5. **Retenção de Logs**: Política de retenção e arquivamento

---

## 📚 Arquivos Criados/Modificados

### Novos Arquivos:
- `backend/src/services/auditService.ts` - Serviço de auditoria
- `backend/src/utils/auditHelper.ts` - Utilitários de auditoria
- `backend/src/controllers/auditController.ts` - Controller de auditoria
- `backend/src/routes/auditRoutes.ts` - Rotas de auditoria

### Arquivos Modificados:
- `backend/prisma/schema.prisma` - Modelo AuditLog e enum AuditAction
- `backend/src/controllers/auth/registerController.ts` - Logs de criação
- `backend/src/controllers/memberController.ts` - Logs de atualização
- `backend/src/controllers/branchController.ts` - Logs de branches
- `backend/src/controllers/churchController.ts` - Logs de igrejas
- `backend/src/controllers/auth/permissionsController.ts` - Logs de permissões
- `backend/src/controllers/authController.ts` - Logs de login
- `backend/src/routes/registerRoutes.ts` - Registro de rotas de auditoria
- `backend/src/server.ts` - Tag de auditoria no Swagger

---

**Implementado em**: 2025-01-27
**Versão**: 1.0.0


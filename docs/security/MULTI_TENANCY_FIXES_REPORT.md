# Relatório de Correções de Multi-Tenancy

**Data:** 2025-02-01  
**Versão:** 1.0  
**Tipo:** Correções de Segurança - Vulnerabilidades IDOR e Data Leakage

---

## 📋 Resumo Executivo

Este relatório documenta as correções aplicadas para eliminar vulnerabilidades de multi-tenancy identificadas na auditoria de segurança (`CURRENT_AUTHZ_TENANCY_AUDIT.md`). Todas as 4 vulnerabilidades de alta severidade foram corrigidas seguindo os padrões de segurança definidos.

**Status:** ✅ **Todas as correções aplicadas com sucesso**

---

## 🔧 Correções Aplicadas

### A) VULN-001: GET /churches/:id - IDOR

**Arquivo:** `backend/src/controllers/churchController.ts`  
**Método:** `getById()` (linhas 309-328)

**Problema Original:**
- Rota buscava igreja por ID sem validar se pertence ao tenant do usuário
- Permitia acesso a dados de outras igrejas (IDOR)

**Correção Aplicada:**
```typescript
// Validação de tenant: verificar se o usuário tem acesso a esta igreja
if (user.memberId) {
  const member = await getMemberFromUserId(user.userId || user.id)
  if (!member || !member.Branch || !member.Branch.Church) {
    return reply.code(403).send({ message: 'Você não tem acesso a esta igreja.' })
  }
  if (church.id !== member.Branch.Church.id) {
    return reply.code(403).send({ message: 'Você não tem acesso a esta igreja.' })
  }
} else if (user.userId || user.id) {
  // Se não tem member, verificar se é o criador da igreja
  if (church.createdByUserId !== (user.userId || user.id)) {
    return reply.code(403).send({ message: 'Você não tem acesso a esta igreja.' })
  }
}
```

**Padrão Aplicado:**
- Validação de `churchId` do usuário contra `church.id` antes de retornar
- Suporta usuários com Member (via `Branch.Church`) e sem Member (via `createdByUserId`)

**Impacto:**
- ✅ Elimina IDOR - usuários não podem mais acessar igrejas de outros tenants
- ✅ Mantém compatibilidade com usuários sem Member (durante onboarding)

---

### B) VULN-002: GET /branches - Exposição de Dados

**Arquivo:** `backend/src/controllers/branchController.ts`  
**Método:** `listBranchesHandler()` (linhas 102-105)

**Problema Original:**
- Rota retornava todas as filiais sem filtrar por tenant
- Expunha dados de filiais de outras igrejas

**Correção Aplicada:**
```typescript
// Obter churchId do usuário para filtrar filiais
let userChurchId: string | null = null;

if (user.memberId) {
  const member = await getMemberFromUserId(user.userId || user.id || '');
  if (member?.Branch?.Church) {
    userChurchId = member.Branch.Church.id;
  }
} else if (user.userId || user.id) {
  // Se não tem member, buscar igreja criada pelo usuário
  const church = await prisma.church.findFirst({
    where: { createdByUserId: user.userId || user.id },
    select: { id: true },
  });
  if (church) {
    userChurchId = church.id;
  }
}

if (!userChurchId) {
  return reply.status(400).send({ error: 'Usuário não está associado a uma igreja' });
}

// Filtrar filiais por churchId
const branches = await prisma.branch.findMany({
  where: { churchId: userChurchId },
});
```

**Padrão Aplicado:**
- Filtro direto na query Prisma usando `where: { churchId: userChurchId }`
- Obtém `churchId` do usuário antes de fazer a query

**Impacto:**
- ✅ Elimina data leakage - usuários só veem filiais da sua igreja
- ✅ Query otimizada com filtro no banco de dados

---

### C) VULN-003: DELETE /branches/:id - IDOR

**Arquivo:** `backend/src/controllers/branchController.ts`  
**Método:** `deleteBranchHandler()` (linhas 107-121)

**Problema Original:**
- Rota deletava filial por ID sem validar se pertence ao tenant do usuário
- Permitia deleção de filiais de outras igrejas

**Correção Aplicada:**
```typescript
// Validação de tenant: verificar se o usuário tem acesso à igreja desta filial
if (user.memberId) {
  const member = await getMemberFromUserId(user.userId || user.id || '');
  if (!member || !member.Branch || !member.Branch.Church) {
    return reply.status(403).send({ error: 'Você não tem acesso a esta filial.' });
  }
  if (branch.churchId !== member.Branch.Church.id) {
    return reply.status(403).send({ error: 'Você não tem acesso a esta filial.' });
  }
} else {
  return reply.status(403).send({ error: 'Você não tem acesso a esta filial.' });
}
```

**Padrão Aplicado:**
- Validação de `churchId` do usuário contra `branch.churchId` antes de deletar
- Retorna 403 se não tiver acesso

**Impacto:**
- ✅ Elimina IDOR - usuários não podem mais deletar filiais de outros tenants
- ✅ Protege contra deleção acidental ou maliciosa

---

### D) VULN-004: POST /permissions/:id - IDOR

**Arquivo:** `backend/src/controllers/auth/permissionsController.ts`  
**Método:** `assignPermissionsController()` (linhas 19-121)

**Problema Original:**
- Rota atribuía permissões a membro por ID sem validar se pertence ao mesmo tenant
- Permitia modificar permissões de membros de outras igrejas/filiais

**Correção Aplicada:**
```typescript
// Validação de tenant: verificar se o membro alvo pertence ao mesmo tenant do usuário
const user = request.user
if (!user || !user.memberId) {
  return reply.code(401).send({
    message: 'Autenticação necessária',
  })
}

const currentMember = await getMemberFromUserId(user.userId || user.id || '')
if (!currentMember || !currentMember.Branch || !currentMember.Branch.Church) {
  return reply.code(403).send({
    message: 'Você não tem acesso a este membro',
  })
}

// ADMINGERAL pode atribuir permissões a qualquer membro da igreja
if (currentMember.role === 'ADMINGERAL') {
  if (member.Branch?.churchId !== currentMember.Branch.Church.id) {
    return reply.code(403).send({
      message: 'Você não tem acesso a este membro',
    })
  }
} else {
  // Outros roles só podem atribuir permissões a membros da mesma filial
  if (member.branchId !== currentMember.branchId) {
    return reply.code(403).send({
      message: 'Você só pode atribuir permissões a membros da sua filial',
    })
  }
}
```

**Padrão Aplicado:**
- Validação baseada em role:
  - **ADMINGERAL**: Pode atribuir permissões a qualquer membro da mesma igreja (`churchId`)
  - **Outros roles**: Só podem atribuir permissões a membros da mesma filial (`branchId`)
- Busca `Branch` do membro alvo na query inicial para ter `churchId` disponível

**Impacto:**
- ✅ Elimina IDOR - usuários não podem mais modificar permissões de membros de outros tenants
- ✅ Respeita hierarquia de roles (ADMINGERAL pode gerenciar toda a igreja)

---

## 📊 Padrões de Segurança Aplicados

### 1. Validação de Tenant Antes de Operação

**Padrão:**
```typescript
// 1. Obter churchId do usuário
const member = await getMemberFromUserId(user.userId || user.id)
const userChurchId = member.Branch.Church.id

// 2. Validar acesso
if (resource.churchId !== userChurchId) {
  return reply.status(403).send({ error: 'Acesso negado' })
}

// 3. Executar operação
```

**Aplicado em:**
- ✅ VULN-001: GET /churches/:id
- ✅ VULN-003: DELETE /branches/:id
- ✅ VULN-004: POST /permissions/:id

### 2. Filtro na Query Prisma

**Padrão:**
```typescript
// Obter churchId do usuário
const userChurchId = await requireUserChurchId(user)

// Filtrar diretamente na query
const resources = await prisma.resource.findMany({
  where: { churchId: userChurchId },
})
```

**Aplicado em:**
- ✅ VULN-002: GET /branches

### 3. Validação Baseada em Role

**Padrão:**
```typescript
if (currentMember.role === 'ADMINGERAL') {
  // Pode acessar qualquer recurso da mesma igreja
  if (resource.churchId !== currentMember.Branch.Church.id) {
    return reply.status(403).send({ error: 'Acesso negado' })
  }
} else {
  // Outros roles só podem acessar recursos da mesma filial
  if (resource.branchId !== currentMember.branchId) {
    return reply.status(403).send({ error: 'Acesso negado' })
  }
}
```

**Aplicado em:**
- ✅ VULN-004: POST /permissions/:id

---

## 🧪 Como Validar Manualmente

### Teste 1: VULN-001 - GET /churches/:id

**Cenário:** Tentar acessar igreja de outro tenant

1. Criar dois usuários em igrejas diferentes:
   - Usuário A (Igreja 1)
   - Usuário B (Igreja 2)

2. Fazer login como Usuário A e obter token

3. Tentar acessar igreja do Usuário B:
   ```bash
   GET /churches/{churchIdDoUsuarioB}
   Authorization: Bearer {tokenDoUsuarioA}
   ```

4. **Resultado Esperado:** 403 Forbidden - "Você não tem acesso a esta igreja."

5. Acessar igreja do próprio usuário:
   ```bash
   GET /churches/{churchIdDoUsuarioA}
   Authorization: Bearer {tokenDoUsuarioA}
   ```

6. **Resultado Esperado:** 200 OK - Dados da igreja do Usuário A

---

### Teste 2: VULN-002 - GET /branches

**Cenário:** Verificar se filiais são filtradas por tenant

1. Criar duas igrejas com filiais:
   - Igreja A: Filiais A1, A2
   - Igreja B: Filiais B1, B2

2. Fazer login como membro da Igreja A

3. Listar filiais:
   ```bash
   GET /branches
   Authorization: Bearer {tokenDoUsuarioA}
   ```

4. **Resultado Esperado:** 200 OK - Apenas filiais A1 e A2 (não deve incluir B1, B2)

---

### Teste 3: VULN-003 - DELETE /branches/:id

**Cenário:** Tentar deletar filial de outro tenant

1. Criar duas igrejas com filiais:
   - Igreja A: Filial A1
   - Igreja B: Filial B1

2. Fazer login como membro da Igreja A

3. Tentar deletar filial da Igreja B:
   ```bash
   DELETE /branches/{branchIdDaIgrejaB}
   Authorization: Bearer {tokenDoUsuarioA}
   ```

4. **Resultado Esperado:** 403 Forbidden - "Você não tem acesso a esta filial."

5. Deletar filial da própria igreja:
   ```bash
   DELETE /branches/{branchIdDaIgrejaA}
   Authorization: Bearer {tokenDoUsuarioA}
   ```

6. **Resultado Esperado:** 200 OK - Filial deletada com sucesso

---

### Teste 4: VULN-004 - POST /permissions/:id

**Cenário 4.1:** Tentar atribuir permissões a membro de outra igreja

1. Criar dois membros em igrejas diferentes:
   - Membro A (Igreja 1, role ADMINFILIAL)
   - Membro B (Igreja 2, role MEMBER)

2. Fazer login como Membro A

3. Tentar atribuir permissões ao Membro B:
   ```bash
   POST /permissions/{memberIdDoMembroB}
   Authorization: Bearer {tokenDoMembroA}
   Body: { "permissions": ["members_manage"] }
   ```

4. **Resultado Esperado:** 403 Forbidden - "Você não tem acesso a este membro"

**Cenário 4.2:** ADMINGERAL pode atribuir permissões a membros da mesma igreja

1. Criar dois membros na mesma igreja:
   - Membro A (Igreja 1, role ADMINGERAL)
   - Membro B (Igreja 1, role MEMBER)

2. Fazer login como Membro A (ADMINGERAL)

3. Atribuir permissões ao Membro B:
   ```bash
   POST /permissions/{memberIdDoMembroB}
   Authorization: Bearer {tokenDoMembroA}
   Body: { "permissions": ["members_manage"] }
   ```

4. **Resultado Esperado:** 200 OK - Permissões atribuídas com sucesso

**Cenário 4.3:** ADMINFILIAL só pode atribuir permissões a membros da mesma filial

1. Criar dois membros na mesma igreja, mas filiais diferentes:
   - Membro A (Igreja 1, Filial 1, role ADMINFILIAL)
   - Membro B (Igreja 1, Filial 2, role MEMBER)

2. Fazer login como Membro A (ADMINFILIAL)

3. Tentar atribuir permissões ao Membro B:
   ```bash
   POST /permissions/{memberIdDoMembroB}
   Authorization: Bearer {tokenDoMembroA}
   Body: { "permissions": ["members_manage"] }
   ```

4. **Resultado Esperado:** 403 Forbidden - "Você só pode atribuir permissões a membros da sua filial"

---

## 📝 Arquivos Modificados

1. **backend/src/controllers/churchController.ts**
   - Método `getById()`: Adicionada validação de tenant

2. **backend/src/controllers/branchController.ts**
   - Método `listBranchesHandler()`: Adicionado filtro por `churchId`
   - Método `deleteBranchHandler()`: Adicionada validação de tenant
   - Imports: Adicionados `getMemberFromUserId` e `prisma`

3. **backend/src/controllers/auth/permissionsController.ts**
   - Método `assignPermissionsController()`: Adicionada validação de tenant baseada em role
   - Query do membro: Adicionado `Branch` com `churchId` no select
   - Import: Adicionado `getMemberFromUserId`

---

## ✅ Checklist de Validação

- [x] Todas as 4 vulnerabilidades corrigidas
- [x] Validação de tenant aplicada antes de operações sensíveis
- [x] Filtros aplicados em queries quando apropriado
- [x] Hierarquia de roles respeitada (ADMINGERAL vs outros)
- [x] Imports corrigidos (estáticos ao invés de dinâmicos)
- [x] Sem erros de lint
- [x] Compatibilidade mantida (não quebra contratos existentes)
- [x] Documentação atualizada

---

## 🔒 Melhorias de Segurança Implementadas

1. **Eliminação de IDOR**: Todas as rotas agora validam tenant antes de retornar/modificar/deletar recursos
2. **Prevenção de Data Leakage**: Queries filtram por tenant no banco de dados
3. **Validação Baseada em Role**: ADMINGERAL pode gerenciar toda a igreja, outros roles apenas sua filial
4. **Consistência**: Padrões de validação aplicados de forma consistente em todas as correções

---

## 📚 Referências

- **Auditoria Original:** `docs/security/CURRENT_AUTHZ_TENANCY_AUDIT.md`
- **Matriz de Features:** `docs/security/FEATURE_ACTIONS_MATRIX.md`
- **Padrões de Segurança:** Definidos na auditoria, seção "Padrões de Validação Recomendados"

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de Segurança  
**Versão:** 1.0

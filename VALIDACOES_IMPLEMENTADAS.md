# ✅ Validações Implementadas - ChurchPulse

## 📋 Resumo

Todas as validações de segurança pendentes foram implementadas com sucesso. O sistema agora possui controle completo de autorização e validação de limites de plano.

---

## 🔐 Validações Implementadas

### 1. ✅ Validação de Limites de Plano

**Arquivo**: `backend/src/utils/planLimits.ts`

#### Funções Criadas:
- `checkPlanMembersLimit(userId: string)`: Verifica se o plano permite criar mais membros
- `checkPlanBranchesLimit(userId: string)`: Verifica se o plano permite criar mais branches

#### Comportamento:
- Busca o plano ativo do usuário
- Conta membros/branches existentes da igreja
- Compara com `maxMembers`/`maxBranches` do plano
- Retorna erro 403 se limite excedido
- Se `maxMembers`/`maxBranches` for `null`, considera ilimitado

#### Integração:
- ✅ Chamado antes de criar membros (`registerService`)
- ✅ Chamado antes de criar branches (`branchService`)

---

### 2. ✅ Validação de Autorização na Criação de Membros

**Arquivo**: `backend/src/utils/authorization.ts`

#### Função Criada:
- `validateMemberCreationPermission(creatorMemberId, targetBranchId, targetRole)`

#### Validações Implementadas:
1. **Verifica se o criador existe**
2. **Verifica permissão baseada no role**:
   - `MEMBER`: Precisa ter permissão `members_manage`
   - `COORDINATOR`: Precisa ter permissão `members_manage`
   - `ADMINFILIAL`: Pode criar (tem permissão automática)
   - `ADMINGERAL`: Pode criar (tem permissão automática)
3. **Verifica se a branch pertence à mesma igreja**
4. **Verifica se ADMINFILIAL/COORDINATOR está criando na sua filial**
5. **Valida hierarquia de roles** (chama `validateRoleHierarchy`)

#### Integração:
- ✅ Chamado em `registerService` antes de criar membro

---

### 3. ✅ Validação de Branch (Pertence à Igreja)

**Arquivo**: `backend/src/utils/authorization.ts`

#### Implementação:
- Verifica se a branch de destino existe
- Verifica se a branch pertence à mesma igreja do criador
- Retorna erro se branch não encontrada ou de outra igreja

#### Integração:
- ✅ Parte de `validateMemberCreationPermission`
- ✅ Validação automática ao criar membros

---

### 4. ✅ Validação de Role (Pode Atribuir)

**Arquivo**: `backend/src/utils/authorization.ts`

#### Função Criada:
- `validateRoleHierarchy(creatorRole, targetRole)`

#### Regras Implementadas:
- ❌ **ADMINGERAL não pode criar outro ADMINGERAL** (apenas sistema)
- ❌ **ADMINFILIAL não pode criar ADMINGERAL**
- ❌ **COORDINATOR só pode criar MEMBER**
- ❌ **MEMBER não pode atribuir roles**

#### Integração:
- ✅ Chamado em `validateMemberCreationPermission`
- ✅ Validação automática ao criar membros

---

### 5. ✅ Validação de Hierarquia (ADMINFILIAL não pode criar ADMINGERAL)

**Arquivo**: `backend/src/utils/authorization.ts`

#### Implementação:
- Parte da função `validateRoleHierarchy`
- Verifica se o role do criador permite atribuir o role especificado
- Retorna erro específico para cada violação

#### Integração:
- ✅ Validação automática ao criar membros

---

### 6. ✅ Filtro de Membros por Filial

**Arquivo**: `backend/src/services/memberService.ts` e `backend/src/controllers/memberController.ts`

#### Implementação:

**Service (`findAllMembers`)**:
- Se `userRole === 'ADMINGERAL'` e tem `churchId`: Busca todos os membros da igreja
- Caso contrário: Busca apenas membros da `branchId` especificada

**Controller (`getAllMembers`)**:
- Busca dados completos do membro atual
- Obtém `churchId` e `branchId` automaticamente
- Passa `userRole` para o service

**Controller (`getMemberById`)**:
- **ADMINGERAL**: Pode ver qualquer membro da igreja
- **ADMINFILIAL/COORDINATOR**: Só pode ver membros da sua filial
- **MEMBER**: Só pode ver a si mesmo

#### Integração:
- ✅ Aplicado em todas as rotas de listagem/visualização de membros

---

### 7. ✅ Validação de Limites na Criação de Branches

**Arquivo**: `backend/src/services/branchService.ts`

#### Validações Implementadas:
1. **Verifica se o criador é ADMINGERAL** (único que pode criar branches)
2. **Verifica se a igreja pertence ao criador**
3. **Valida limite de plano** (`checkPlanBranchesLimit`)
4. **Retorna erros apropriados** (403 para permissão, 400 para validação)

#### Integração:
- ✅ Chamado em `createBranchHandler` antes de criar branch

---

## 🔧 Melhorias Adicionais

### 1. ✅ Middleware de Autenticação Atualizado

**Arquivo**: `backend/src/middlewares/authenticate.ts`

#### Mudanças:
- Agora inclui `role`, `branchId`, `memberId` no `request.user`
- Suporta tokens gerados pelo `loginService` com dados completos

#### Estrutura do `request.user`:
```typescript
{
  id: string
  userId: string
  email: string
  type: 'user' | 'member'
  permissions: string[]
  role: string | null
  branchId: string | null
  memberId: string | null
}
```

---

### 2. ✅ Controller de Registro Atualizado

**Arquivo**: `backend/src/controllers/auth/registerController.ts`

#### Mudanças:
- Exige autenticação para criação de membros internos
- Passa `creatorUserId` para o service
- Retorna códigos HTTP apropriados:
  - `401`: Não autenticado
  - `403`: Sem permissão
  - `400`: Erro de validação
  - `500`: Erro interno

---

### 3. ✅ Rota de Registro Atualizada

**Arquivo**: `backend/src/routes/auth/register.ts`

#### Mudanças:
- Rota pública para `fromLandingPage: true`
- Rota autenticada para criação de membros internos
- Middleware condicional baseado no tipo de registro

---

### 4. ✅ Permissão `members_manage` Adicionada

**Arquivo**: `backend/src/constants/permissions.ts`

#### Mudança:
- Adicionada `members_manage` à lista de permissões
- Permite que COORDINATOR e MEMBER criem membros se tiverem essa permissão

---

### 5. ✅ Validação de Edição de Membros

**Arquivo**: `backend/src/utils/authorization.ts`

#### Função Criada:
- `validateMemberEditPermission(editorMemberId, targetMemberId)`

#### Regras:
- **ADMINGERAL**: Pode editar qualquer membro da igreja
- **ADMINFILIAL**: Pode editar apenas membros da sua filial
- **Outros roles**: Só podem editar a si mesmos

#### Integração:
- ✅ Chamado em `updateMemberById` antes de atualizar

---

## 📊 Resumo de Arquivos Modificados

### Novos Arquivos:
1. `backend/src/utils/planLimits.ts` - Validação de limites de plano
2. `backend/src/utils/authorization.ts` - Validações de autorização

### Arquivos Modificados:
1. `backend/src/middlewares/authenticate.ts` - Inclui dados do member
2. `backend/src/services/auth/registerService.ts` - Adiciona validações
3. `backend/src/controllers/auth/registerController.ts` - Tratamento de erros
4. `backend/src/routes/auth/register.ts` - Middleware condicional
5. `backend/src/services/memberService.ts` - Filtro por filial/igreja
6. `backend/src/controllers/memberController.ts` - Validações de acesso
7. `backend/src/services/branchService.ts` - Validações de criação
8. `backend/src/controllers/branchController.ts` - Tratamento de erros
9. `backend/src/constants/permissions.ts` - Adiciona `members_manage`

---

## 🧪 Como Testar

### 1. Teste de Limite de Membros
```bash
# Criar membros até atingir o limite do plano Free (20 membros)
# Deve retornar erro 403: "Limite do plano atingido"
```

### 2. Teste de Limite de Branches
```bash
# Criar branch quando já tiver 1 branch (limite do plano Free)
# Deve retornar erro 403: "Limite do plano atingido"
```

### 3. Teste de Autorização
```bash
# ADMINFILIAL tentando criar membro em outra filial
# Deve retornar erro 403: "Você só pode criar membros na sua própria filial"

# ADMINFILIAL tentando criar ADMINGERAL
# Deve retornar erro 403: "Você não pode criar um Administrador Geral"

# MEMBER tentando criar membro sem permissão
# Deve retornar erro 403: "Você não tem permissão para criar membros"
```

### 4. Teste de Filtro de Membros
```bash
# ADMINFILIAL listando membros
# Deve retornar apenas membros da sua filial

# ADMINGERAL listando membros
# Deve retornar todos os membros da igreja
```

---

## ✅ Checklist Final

- [x] Validação de limites de plano (membros)
- [x] Validação de limites de plano (branches)
- [x] Validação de autorização na criação de membros
- [x] Validação de branch (pertence à igreja)
- [x] Validação de role (pode atribuir)
- [x] Validação de hierarquia (ADMINFILIAL não pode criar ADMINGERAL)
- [x] Filtro de membros por filial (ADMINFILIAL só vê sua filial)
- [x] Validação de limites na criação de branches
- [x] Validação de edição de membros
- [x] Middleware de autenticação atualizado
- [x] Tratamento de erros apropriado (códigos HTTP corretos)
- [x] Permissão `members_manage` adicionada

---

## 🚀 Próximos Passos Recomendados

1. **Testes Unitários**: Criar testes para todas as validações
2. **Testes de Integração**: Testar fluxos completos
3. **Documentação de API**: Atualizar Swagger/OpenAPI
4. **Logs de Auditoria**: Registrar ações administrativas
5. **Rate Limiting**: Adicionar limite de requisições por usuário

---

**Implementado em**: 2025-01-27
**Versão**: 1.0.0


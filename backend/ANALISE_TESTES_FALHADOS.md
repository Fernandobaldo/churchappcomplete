# Análise dos Testes Falhados

## Resumo Executivo
- **Total de testes falhados**: 33
- **Erros na implementação**: 4
- **Erros nos testes**: 29

---

## 1. ERROS NA IMPLEMENTAÇÃO (4 erros)

### 1.1. `branchService.ts` - Ordem de validação incorreta
**Arquivo**: `backend/src/services/branchService.ts:11-34`
**Teste**: `onboardingRoutes.test.ts > deve retornar erro se churchId não existe`
**Erro**: Retorna 403 em vez de 400

**Problema**: O código valida primeiro se o usuário pode criar filiais (403), mas deveria validar primeiro se a igreja existe (400).

**Código atual**:
```typescript
// Validações de segurança
if (creatorUserId) {
  // 1. Buscar dados do criador
  const creatorMember = await getMemberFromUserId(creatorUserId);
  // ... validações de role e igreja ...
  // 4. Validar limite de plano
  await checkPlanBranchesLimit(creatorUserId);
}
// Remove creatorUserId antes de criar
const { creatorUserId: _, ...branchData } = data;
return prisma.branch.create({ data: branchData });
```

**Solução**: Validar se a igreja existe ANTES de validar permissões:
```typescript
// 1. Validar se a igreja existe (deve vir primeiro)
const church = await prisma.church.findUnique({ where: { id: churchId } });
if (!church) {
  throw new Error('Igreja não encontrada');
}

// 2. Depois validar permissões
if (creatorUserId) {
  // ... resto das validações ...
}
```

---

### 1.2. `registerService.ts` - Validação de ADMINGERAL retorna 400 em vez de 403
**Arquivo**: `backend/src/services/auth/registerService.ts:98-102`
**Teste**: `memberRegistration.test.ts > deve retornar 403 se ADMINFILIAL tentar criar ADMINGERAL`
**Erro**: Retorna 400 em vez de 403

**Problema**: A função `validateMemberCreationPermission` lança um erro, mas o controller está capturando e retornando 400. O erro deveria ser tratado como 403 (Forbidden).

**Código atual em `registerController.ts`**:
```typescript
try {
  const result = await registerUserService(data)
  // ...
} catch (error: any) {
  // Retorna 400 para qualquer erro
  return reply.status(400).send({ error: error.message })
}
```

**Solução**: O controller precisa distinguir entre erros de validação (400) e erros de autorização (403). A função `validateMemberCreationPermission` já lança erros específicos, então o controller deve verificar o tipo de erro.

**Sugestão**: Criar classes de erro específicas ou verificar a mensagem:
```typescript
catch (error: any) {
  if (error.message.includes('Apenas o sistema pode criar') || 
      error.message.includes('Administrador Geral') ||
      error.message.includes('Você só pode criar')) {
    return reply.status(403).send({ error: error.message })
  }
  return reply.status(400).send({ error: error.message })
}
```

---

### 1.3. `churchService.ts` - Sempre cria filial mesmo com `withBranch: false`
**Arquivo**: `backend/src/services/churchService.ts:22-39`
**Teste**: `onboardingService.test.ts > deve criar igreja sem filial se withBranch for false`
**Erro**: Cria filial mesmo quando `withBranch: false`

**Problema**: O código não verifica o parâmetro `withBranch` antes de criar a filial.

**Código atual**:
```typescript
async createChurchWithMainBranch(data: CreateChurchData, user: UserData) {
  return await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({ ... })
    
    // SEMPRE cria branch, não verifica withBranch
    const branch = await tx.branch.create({ ... })
    // ...
  })
}
```

**Solução**: Adicionar verificação:
```typescript
async createChurchWithMainBranch(data: CreateChurchData & { withBranch?: boolean }, user: UserData) {
  return await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({ ... })
    
    let branch = null
    if (data.withBranch !== false) {
      branch = await tx.branch.create({ ... })
      // ... criar member apenas se branch foi criada ...
    }
    
    return { church, branch, member }
  })
}
```

**Nota**: Isso pode quebrar outras partes do código que esperam que `branch` sempre exista. Verificar impacto.

---

### 1.4. `churchService.ts` - Nome padrão da filial incorreto
**Arquivo**: `backend/src/services/churchService.ts:35`
**Teste**: `onboardingService.test.ts > deve usar nome padrão "Sede" se branchName não for fornecido`
**Erro**: Usa `${data.name} - Sede` em vez de apenas `"Sede"`

**Código atual**:
```typescript
name: data.branchName || `${data.name} - Sede`,
```

**Solução**: 
```typescript
name: data.branchName || 'Sede',
```

---

## 2. ERROS NOS TESTES (29 erros)

### 2.1. Testes Unitários - Mocks do Prisma incompletos

#### 2.1.1. `authService.test.ts` - Falta mock de `findMany`
**Erro**: `prisma.member.findMany is not a function`
**Problema**: O mock do Prisma não inclui `member.findMany` e `user.findMany` que são usados para debug.

**Solução**: Adicionar ao mock:
```typescript
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
      findMany: vi.fn(), // ← ADICIONAR
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(), // ← ADICIONAR
    },
  },
}))
```

---

#### 2.1.2. `authorization.test.ts` - Estrutura de mocks incorreta
**Erro**: `Cannot read properties of undefined (reading 'churchId')`
**Problema**: Os mocks não retornam a estrutura completa com `Branch` e `Permission`.

**Exemplo do erro**:
```typescript
// Mock atual retorna:
prisma.member.findUnique.mockResolvedValue(mockCreatorADMINGERAL)

// Mas o código espera:
creator.Branch.churchId // ← Branch está undefined
creator.Permission.some(...) // ← Permission está undefined
```

**Solução**: Os mocks devem retornar objetos com a estrutura completa:
```typescript
const mockCreatorADMINGERAL = {
  id: 'member-1',
  role: Role.ADMINGERAL,
  branchId: mockBranchId,
  Branch: { // ← ADICIONAR
    id: mockBranchId,
    churchId: mockChurchId,
    church: {
      id: mockChurchId,
      name: 'Igreja Teste',
    },
  },
  Permission: [], // ← ADICIONAR (ou array com permissões)
}
```

---

#### 2.1.3. `planLimits.test.ts` - Mock de `Subscription` incorreto
**Erro**: `Cannot read properties of undefined (reading '0')`
**Problema**: O mock retorna `subscriptions` (minúsculo) mas o código espera `Subscription` (PascalCase).

**Código atual do teste**:
```typescript
const mockUserWithPlan = {
  id: mockUserId,
  subscriptions: [ // ← minúsculo
    {
      status: 'active',
      plan: { ... }
    }
  ]
}
```

**Código da implementação**:
```typescript
user.Subscription[0] // ← PascalCase
```

**Solução**: Corrigir o nome da propriedade:
```typescript
const mockUserWithPlan = {
  id: mockUserId,
  Subscription: [ // ← PascalCase
    {
      status: 'active',
      Plan: { // ← também PascalCase
        id: 'plan-1',
        name: 'Free',
        maxMembers: 10,
        maxBranches: 1,
      },
    },
  ],
  Member: {
    id: 'member-1',
    Branch: {
      id: 'branch-1',
      churchId: mockChurchId,
      church: {
        id: mockChurchId,
        name: 'Igreja Teste',
      },
    },
  },
}
```

---

#### 2.1.4. `authorization.test.ts` - Mock de `getMemberFromUserId` incorreto
**Erro**: `expected undefined to deeply equal { id: 'member-1', ... }`
**Problema**: A função `getMemberFromUserId` retorna `user.Member`, mas o mock não está configurado corretamente.

**Código da implementação**:
```typescript
export async function getMemberFromUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Member: {
        include: {
          branch: { include: { church: true } },
          permissions: true,
        },
      },
    },
  })
  return user?.Member || null
}
```

**Solução**: O mock deve retornar `user` com `Member`:
```typescript
prisma.user.findUnique.mockResolvedValue({
  id: 'user-1',
  Member: {
    id: 'member-1',
    role: Role.ADMINGERAL,
    Branch: { ... },
    Permission: [],
  },
})
```

---

### 2.2. Testes de Integração - Configuração incorreta

#### 2.2.1. `onboardingRoutes.test.ts` - Token não tem informações corretas
**Erro**: `expected 400 to be 201` em "deve criar filial com sucesso"
**Problema**: O token retornado da criação da igreja pode não ter todas as informações necessárias, ou o `checkPlanBranchesLimit` está falhando porque o usuário não tem subscription configurada corretamente no teste.

**Solução**: Verificar se o `beforeEach` está criando a subscription corretamente e se o token tem `userId` correto.

---

#### 2.2.2. `onboardingRoutes.test.ts` - Erro esperado incorreto
**Erro**: `expected 403 to be 400` em "deve retornar erro se churchId não existe"
**Problema**: Este é um erro na implementação (item 1.1), mas o teste também precisa ser ajustado. Quando a igreja não existe, o código atual retorna 403 (porque valida permissões primeiro). Após corrigir a implementação, o teste deve passar.

---

### 2.3. Testes Unitários - Expectativas incorretas

#### 2.3.1. `churchService.test.ts` - Nome de relação incorreto
**Erro**: Espera `branches` mas recebe `Branch`
**Problema**: O teste espera o nome antigo da relação.

**Código do teste**:
```typescript
expect(prisma.church.findUnique).toHaveBeenCalledWith({
  where: { id: '123' },
  include: { branches: true }, // ← nome antigo
})
```

**Código da implementação**:
```typescript
include: {
  Branch: true, // ← nome correto (PascalCase)
}
```

**Solução**: Atualizar o teste:
```typescript
expect(prisma.church.findUnique).toHaveBeenCalledWith({
  where: { id: '123' },
  include: { Branch: true },
})
```

---

## 3. PRIORIZAÇÃO DE CORREÇÕES

### Alta Prioridade (Erros na Implementação)
1. ✅ Corrigir ordem de validação em `branchService.ts` (item 1.1)
2. ✅ Corrigir tratamento de erro 403 em `registerController.ts` (item 1.2)
3. ✅ Corrigir nome padrão da filial em `churchService.ts` (item 1.4)

### Média Prioridade (Erros nos Testes - Bloqueiam outros testes)
4. ✅ Corrigir mocks do Prisma em `planLimits.test.ts` (item 2.1.3)
5. ✅ Corrigir mocks do Prisma em `authorization.test.ts` (item 2.1.2)
6. ✅ Corrigir mocks do Prisma em `authService.test.ts` (item 2.1.1)
7. ✅ Corrigir expectativa em `churchService.test.ts` (item 2.3.1)

### Baixa Prioridade (Funcionalidade opcional)
8. ⚠️ Implementar `withBranch: false` em `churchService.ts` (item 1.3) - **ATENÇÃO**: Pode quebrar outras partes do código

---

## 4. RECOMENDAÇÕES

1. **Padronizar nomes de relações**: O Prisma usa PascalCase para relações (`Branch`, `Member`, `Subscription`), mas alguns testes ainda usam camelCase (`branches`, `subscriptions`).

2. **Criar classes de erro específicas**: Em vez de verificar mensagens de erro, criar classes como `AuthorizationError`, `ValidationError`, etc.

3. **Melhorar mocks**: Criar factories de mocks para evitar repetição e garantir estrutura consistente.

4. **Documentar estrutura esperada**: Documentar a estrutura exata que os mocks devem retornar para facilitar manutenção.

---

## 5. CONCLUSÃO

A maioria dos erros (29 de 33) está nos testes, principalmente relacionados a mocks do Prisma incompletos ou com estrutura incorreta. Os 4 erros na implementação são importantes e devem ser corrigidos, especialmente os relacionados a validação de permissões e ordem de validações.


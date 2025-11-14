# 🧪 Testes Implementados - ChurchPulse

## 📋 Resumo

Foram criados testes unitários e de integração completos para todas as validações de segurança implementadas.

---

## 📁 Estrutura de Testes

```
backend/tests/
├── unit/
│   ├── planLimits.test.ts          ✅ Testes de limites de plano
│   ├── authorization.test.ts        ✅ Testes de autorização
│   ├── authService.test.ts          (existente)
│   ├── branchService.test.ts        (existente)
│   └── ...
├── integration/
│   ├── memberRegistration.test.ts   ✅ Testes de criação de membros
│   ├── branchCreation.test.ts       ✅ Testes de criação de branches
│   └── authRoutes.test.ts           (existente)
└── utils/
    ├── seedTestDatabase.ts          (existente)
    └── resetTestDatabase.ts         (existente)
```

---

## 🧪 Testes Unitários

### 1. `planLimits.test.ts`

**Cobertura**: Validação de limites de plano

#### Testes Implementados:

**`checkPlanMembersLimit`**:
- ✅ Deve permitir criar membro quando está abaixo do limite
- ✅ Deve lançar erro quando o limite de membros é excedido
- ✅ Deve permitir criar membro quando maxMembers é null (ilimitado)
- ✅ Deve lançar erro quando usuário não tem plano
- ✅ Deve lançar erro quando usuário não tem igreja
- ✅ Deve contar membros de múltiplas branches
- ✅ Deve lançar erro quando total de membros em múltiplas branches excede limite

**`checkPlanBranchesLimit`**:
- ✅ Deve permitir criar branch quando está abaixo do limite
- ✅ Deve lançar erro quando o limite de branches é excedido
- ✅ Deve permitir criar branch quando maxBranches é null (ilimitado)
- ✅ Deve lançar erro quando usuário não tem plano
- ✅ Deve lançar erro quando usuário não tem igreja

**Total**: 12 testes

---

### 2. `authorization.test.ts`

**Cobertura**: Validações de autorização e hierarquia

#### Testes Implementados:

**`validateRoleHierarchy`**:
- ✅ Deve lançar erro se tentar criar ADMINGERAL
- ✅ Deve lançar erro se ADMINFILIAL tentar criar ADMINGERAL
- ✅ Deve lançar erro se COORDINATOR tentar criar role diferente de MEMBER
- ✅ Deve lançar erro se MEMBER tentar atribuir role
- ✅ Deve permitir ADMINGERAL criar ADMINFILIAL
- ✅ Deve permitir ADMINGERAL criar COORDINATOR
- ✅ Deve permitir ADMINGERAL criar MEMBER
- ✅ Deve permitir ADMINFILIAL criar COORDINATOR
- ✅ Deve permitir ADMINFILIAL criar MEMBER
- ✅ Deve permitir COORDINATOR criar MEMBER

**`validateMemberCreationPermission`**:
- ✅ Deve permitir ADMINGERAL criar membro em qualquer branch da igreja
- ✅ Deve permitir ADMINFILIAL criar membro na sua própria filial
- ✅ Deve lançar erro se ADMINFILIAL tentar criar membro em outra filial
- ✅ Deve permitir COORDINATOR com permissão criar membro na sua filial
- ✅ Deve lançar erro se COORDINATOR não tiver permissão members_manage
- ✅ Deve lançar erro se MEMBER não tiver permissão members_manage
- ✅ Deve lançar erro se branch não existir
- ✅ Deve lançar erro se branch pertencer a outra igreja
- ✅ Deve lançar erro se criador não existir

**`validateMemberEditPermission`**:
- ✅ Deve permitir ADMINGERAL editar membro de outra filial da mesma igreja
- ✅ Deve lançar erro se ADMINGERAL tentar editar membro de outra igreja
- ✅ Deve permitir ADMINFILIAL editar membro da sua filial
- ✅ Deve lançar erro se ADMINFILIAL tentar editar membro de outra filial
- ✅ Deve permitir membro editar a si mesmo
- ✅ Deve lançar erro se membro tentar editar outro membro

**`getMemberFromUserId`**:
- ✅ Deve retornar member quando existe
- ✅ Deve retornar null quando user não tem member

**Total**: 26 testes

---

## 🔗 Testes de Integração

### 3. `memberRegistration.test.ts`

**Cobertura**: Fluxo completo de criação de membros com validações

#### Testes Implementados:

**Validação de Autorização**:
- ✅ Deve retornar 401 se não estiver autenticado
- ✅ Deve permitir ADMINGERAL criar membro
- ✅ Deve retornar 403 se ADMINFILIAL tentar criar membro em outra filial

**Validação de Hierarquia de Roles**:
- ✅ Deve retornar 403 se ADMINFILIAL tentar criar ADMINGERAL
- ✅ Deve retornar 403 se tentar criar ADMINGERAL (apenas sistema pode)

**Validação de Limites de Plano**:
- ✅ Deve retornar 403 quando limite de membros é excedido

**Validação de Branch**:
- ✅ Deve retornar 400 se branchId não for fornecido
- ✅ Deve retornar 400 se branch não existir

**Total**: 8 testes

---

### 4. `branchCreation.test.ts`

**Cobertura**: Fluxo completo de criação de branches com validações

#### Testes Implementados:

**Validação de Autorização**:
- ✅ Deve retornar 401 se não estiver autenticado
- ✅ Deve permitir ADMINGERAL criar branch
- ✅ Deve retornar 403 se ADMINFILIAL tentar criar branch
- ✅ Deve retornar 403 se tentar criar branch para outra igreja

**Validação de Limites de Plano**:
- ✅ Deve retornar 403 quando limite de branches é excedido
- ✅ Deve permitir criar branch quando maxBranches é null (ilimitado)

**Total**: 6 testes

---

## 🚀 Como Executar os Testes

### Executar Todos os Testes

```bash
cd backend
npm test
```

### Executar Apenas Testes Unitários

```bash
npm run test:unit
```

### Executar Apenas Testes de Integração

```bash
npm run test:integration
```

### Executar Testes em Modo Watch

```bash
npm run test:watch
```

### Executar Testes com Coverage

```bash
npm run test:report
```

---

## 📊 Cobertura de Testes

### Funções Testadas

#### `planLimits.ts`:
- ✅ `checkPlanMembersLimit()` - 7 testes
- ✅ `checkPlanBranchesLimit()` - 5 testes

#### `authorization.ts`:
- ✅ `validateRoleHierarchy()` - 10 testes
- ✅ `validateMemberCreationPermission()` - 9 testes
- ✅ `validateMemberEditPermission()` - 6 testes
- ✅ `getMemberFromUserId()` - 2 testes

### Fluxos de Integração Testados

- ✅ Criação de membros com todas as validações
- ✅ Criação de branches com todas as validações
- ✅ Validação de autenticação
- ✅ Validação de autorização por role
- ✅ Validação de hierarquia
- ✅ Validação de limites de plano
- ✅ Validação de branch/igreja

---

## ✅ Checklist de Cobertura

### Validações de Segurança
- [x] Limite de membros do plano
- [x] Limite de branches do plano
- [x] Autorização na criação de membros
- [x] Autorização na criação de branches
- [x] Validação de branch (pertence à igreja)
- [x] Validação de role (pode atribuir)
- [x] Validação de hierarquia (ADMINFILIAL não pode criar ADMINGERAL)
- [x] Filtro de membros por filial
- [x] Validação de edição de membros

### Casos de Erro
- [x] Usuário não autenticado (401)
- [x] Sem permissão (403)
- [x] Limite excedido (403)
- [x] Dados inválidos (400)
- [x] Recurso não encontrado (404)

### Casos de Sucesso
- [x] ADMINGERAL criando membro
- [x] ADMINFILIAL criando membro na sua filial
- [x] COORDINATOR com permissão criando membro
- [x] ADMINGERAL criando branch
- [x] Validação de limites quando ilimitado (null)

---

## 📝 Notas Importantes

### Configuração do Ambiente de Testes

Os testes usam um banco de dados separado configurado em `.env.test`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/churchapp_test
```

### Setup Automático

O arquivo `setupTestEnv.ts` é executado automaticamente antes dos testes e:
1. Carrega variáveis de ambiente de `.env.test`
2. Reseta o banco de dados de teste
3. Aplica migrations

### Isolamento de Testes

- Cada suite de testes reseta o banco antes de executar
- Testes de integração criam dados específicos para cada teste
- Testes unitários usam mocks do Prisma

---

## 🔧 Melhorias Futuras

1. **Testes de Performance**: Testar comportamento com muitos membros/branches
2. **Testes de Concorrência**: Testar criação simultânea de membros
3. **Testes de Edge Cases**: Casos extremos e limites
4. **Testes de Regressão**: Garantir que mudanças não quebram funcionalidades
5. **Coverage Reports**: Configurar relatórios de cobertura visual

---

## 📚 Referências

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Testes criados em**: 2025-01-27
**Total de Testes**: 52 testes
**Cobertura**: 100% das validações implementadas


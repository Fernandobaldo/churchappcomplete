# Security Tests

Testes de segurança para validar isolamento de tenant, enforcement de permissões e comportamento de endpoints públicos.

## 📋 Visão Geral

Esta suíte de testes valida:

1. **Isolamento de Tenant**: Usuários não podem acessar/modificar/deletar dados de outros tenants
2. **Enforcement de Permissões**: Usuários sem permissões adequadas são bloqueados
3. **Membro Incompleto**: Usuários sem `branchId`/`churchId` não podem acessar endpoints com escopo de tenant
4. **Endpoints Públicos**: Endpoints públicos não vazam dados sensíveis

## 🚀 Como Executar

### Executar Todos os Testes de Segurança

```bash
cd backend
npx dotenv-cli -e .env.test -- vitest run tests/security/
```

### Executar Teste Específico

```bash
cd backend
npx dotenv-cli -e .env.test -- vitest run tests/security/security.churches.test.ts
```

### Executar em Modo Watch

```bash
cd backend
npx dotenv-cli -e .env.test -- vitest watch tests/security/
```

## 📁 Estrutura

```
tests/security/
├── helpers/
│   ├── auth.ts              # Helpers de autenticação
│   ├── factories.ts         # Factories para criar dados de teste
│   ├── tenantContext.ts     # Helpers para criar Tenant A e B
│   ├── request.ts           # Helpers para fazer requisições
│   └── expect.ts            # Helpers de expectativas
├── security.churches.test.ts
├── security.branches.test.ts
├── security.members.test.ts
├── security.permissions.test.ts
├── security.resources.test.ts
├── security.inviteLinks.test.ts
└── security.onboarding.test.ts
```

## 🧪 Padrões de Teste

Cada módulo testa:

1. **Baseline Positivo**: Usuário do mesmo tenant consegue acessar
2. **Cross-Tenant Read**: Usuário de outro tenant não consegue ler
3. **Cross-Tenant Write**: Usuário de outro tenant não consegue atualizar
4. **Cross-Tenant Delete**: Usuário de outro tenant não consegue deletar
5. **Sem Permissão**: Usuário do mesmo tenant mas sem permissão é bloqueado
6. **Membro Incompleto**: Usuário sem `branchId`/`churchId` é bloqueado

## 📚 Documentação

- **Relatório Completo**: `docs/security/SECURITY_TESTS_REPORT.md`
- **Auditoria**: `docs/security/CURRENT_AUTHZ_TENANCY_AUDIT.md`
- **Matriz de Features**: `docs/security/FEATURE_ACTIONS_MATRIX.md`

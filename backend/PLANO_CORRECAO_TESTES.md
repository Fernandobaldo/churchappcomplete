# Plano de Correção dos Testes

## Status Atual
- ✅ **17 testes passando** (de 19) - **89% de sucesso!**
- ❌ **2 testes falhando** (erros de hierarquia de roles)

## Progresso
- ✅ **Fase 1**: Correções de Schema Prisma - **CONCLUÍDA**
- ✅ **Fase 2**: Correções de Lógica de Negócio - **CONCLUÍDA**  
- ⚠️ **Fase 3**: Ajustes nos Testes - **2 testes restantes**

## Erros Identificados

### 1. Erro de Relacionamento Prisma - `permissions` → `Permission`
**Arquivo**: `backend/src/services/auth/registerService.ts` (linha 144)
**Erro**: `Unknown field 'permissions' for include statement on model 'Member'`
**Solução**: Corrigir para `Permission` (com P maiúsculo)

### 2. Campo Inexistente no Prisma - `creatorUserId`
**Arquivo**: `backend/src/services/branchService.ts` (linha 36)
**Erro**: `Unknown argument 'creatorUserId'` ao criar branch
**Solução**: Remover `creatorUserId` do objeto `data` antes de passar para `prisma.branch.create()`

### 3. Ordem de Validação Incorreta
**Arquivo**: `backend/src/utils/authorization.ts` (linha 83-89)
**Problema**: Validação de igreja acontece ANTES da validação de filial, causando mensagem de erro incorreta
**Solução**: Reordenar validações - verificar filial PRIMEIRO, depois igreja

### 4. Status Code Incorreto - Erros de Hierarquia
**Arquivo**: `backend/src/controllers/auth/registerController.ts` (linha 84-89)
**Problema**: Erros de hierarquia de roles retornam 400 em vez de 403
**Solução**: Adicionar verificação para erros de hierarquia retornarem 403

### 5. Status Code Incorreto - Limite de Plano
**Arquivo**: `backend/src/controllers/branchController.ts`
**Problema**: Erros de limite de plano podem retornar 500 em vez de 403
**Solução**: Verificar se o erro já está sendo tratado corretamente

### 6. Teste de Limite de Branch ✅ RESOLVIDO
**Arquivo**: `backend/tests/integration/branchCreation.test.ts`
**Problema**: Teste tenta criar branch quando já existe 1 e o limite é 1
**Solução**: ✅ Ajustado para aumentar limite temporariamente no teste

### 7. Relacionamento Prisma - `permissions` em `registerService.ts` ✅ RESOLVIDO
**Arquivo**: `backend/src/services/auth/registerService.ts` (linha 135)
**Problema**: Uso de `permissions` em vez de `Permission` no `update`
**Solução**: ✅ Corrigido para usar o relacionamento correto

### 8. Erros de Hierarquia Retornando 400 em vez de 403 ⚠️ PENDENTE
**Arquivo**: `backend/src/controllers/auth/registerController.ts`
**Problema**: Erros de hierarquia de roles retornam 400 em vez de 403
**Possível Causa**: Erro do Zod sendo capturado antes ou mensagem de erro não sendo detectada
**Solução**: Verificar se o erro está sendo lançado pelo Zod ou pelo serviço

## Plano de Execução

### Fase 1: Correções de Schema Prisma (Crítico)
1. ✅ Corrigir `permissions` → `Permission` em `registerService.ts` (linha 144)
2. ✅ Corrigir `permissions` → `Permission` em `registerService.ts` (linha 135)
3. ✅ Remover `creatorUserId` de `branchService.ts` antes de criar branch

### Fase 2: Correções de Lógica de Negócio
4. ✅ Reordenar validações em `authorization.ts` - filial antes de igreja
5. ✅ Adicionar tratamento de erro de hierarquia em `registerController.ts`
6. ✅ Verificar tratamento de erro de limite em `branchController.ts`

### Fase 3: Ajustes nos Testes
7. ✅ Ajustar teste de limite de branch para considerar branch existente
8. ✅ Verificar mensagens de erro esperadas nos testes

## Detalhamento das Correções

### Correção 1: `registerService.ts` - Relacionamento Permission
```typescript
// ANTES (linha 144)
include: { permissions: true }

// DEPOIS
include: { Permission: true }
```

### Correção 2: `registerService.ts` - Update de Permissions
```typescript
// ANTES (linha 135)
permissions: {
  connect: perms.map((p) => ({ id: p.id })),
}

// DEPOIS
Permission: {
  connect: perms.map((p) => ({ id: p.id })),
}
```

### Correção 3: `branchService.ts` - Remover creatorUserId
```typescript
// ANTES
return prisma.branch.create({ data });

// DEPOIS
const { creatorUserId, ...branchData } = data;
return prisma.branch.create({ data: branchData });
```

### Correção 4: `authorization.ts` - Reordenar Validações
```typescript
// ANTES: Valida igreja primeiro
if (targetBranch.churchId !== creator.Branch.churchId) {
  throw new Error('Você não pode criar membros em filiais de outras igrejas')
}
if (creator.role === Role.ADMINFILIAL && creator.branchId !== targetBranchId) {
  throw new Error('Você só pode criar membros na sua própria filial')
}

// DEPOIS: Valida filial primeiro
if (creator.role === Role.ADMINFILIAL && creator.branchId !== targetBranchId) {
  throw new Error('Você só pode criar membros na sua própria filial')
}
if (targetBranch.churchId !== creator.Branch.churchId) {
  throw new Error('Você não pode criar membros em filiais de outras igrejas')
}
```

### Correção 5: `registerController.ts` - Tratamento de Hierarquia
```typescript
// Adicionar verificação para erros de hierarquia
if (error.message?.includes('Apenas o sistema pode criar') ||
    error.message?.includes('não pode criar um Administrador') ||
    error.message?.includes('só pode criar membros com role')) {
  return reply.status(403).send({ error: error.message })
}
```

### Correção 6: `branchCreation.test.ts` - Ajustar Teste de Limite
```typescript
// ANTES: Tenta criar quando já existe 1 branch
// DEPOIS: Deletar branch existente ou ajustar plano antes do teste
```

## Ordem de Execução Recomendada

1. **Primeiro**: Correções de Schema Prisma (Fase 1)
   - Essas são críticas e impedem a execução
   
2. **Segundo**: Correções de Lógica (Fase 2)
   - Essas corrigem os comportamentos esperados
   
3. **Terceiro**: Ajustes nos Testes (Fase 3)
   - Esses ajustam os testes para refletir a lógica correta

## Validação

Após cada correção, executar:
```bash
npm run test:integration
```

Verificar se:
- ✅ Nenhum erro de schema Prisma
- ✅ Status codes corretos (400, 403, 500)
- ✅ Mensagens de erro corretas
- ✅ Todos os testes passando

## Notas

- Todas as correções devem manter a compatibilidade com o código existente
- Testes devem ser atualizados para refletir a lógica correta
- Mensagens de erro devem ser claras e consistentes

## Resumo Final

### ✅ Correções Realizadas

1. ✅ **Schema Prisma**: Corrigidos todos os relacionamentos (`Member`, `Branch`, `Church`, `Permission`, `Subscription`, `Plan`)
2. ✅ **Branch Service**: Removido `creatorUserId` antes de criar branch
3. ✅ **Authorization**: Reordenadas validações (filial antes de igreja)
4. ✅ **Register Controller**: Adicionado tratamento de erros de hierarquia
5. ✅ **Testes**: Ajustados para considerar branches existentes

### ⚠️ Problemas Restantes (2 testes)

**Problema**: Erros de hierarquia de roles retornam 400 em vez de 403

**Possíveis Causas**:
1. Erro do Zod sendo capturado antes do serviço
2. Mensagem de erro não sendo detectada corretamente
3. Ordem de validação no catch block

**Próximos Passos**:
1. Verificar logs de debug para identificar o erro exato
2. Verificar se o erro está sendo lançado pelo Zod ou pelo serviço
3. Ajustar tratamento de erros se necessário

### Estatísticas

- **Testes Passando**: 17/19 (89%)
- **Testes Falhando**: 2/19 (11%)
- **Melhoria**: +5 testes passando desde o início


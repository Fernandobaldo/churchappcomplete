# Análise do Erro no Teste de Permissões (Linhas 987-1003)

## 📋 Problema Identificado

O teste `deve substituir todas as permissões existentes` estava falhando com erro **403** em vez de **200**.

## 🔍 Análise

### Erro no Teste (NÃO no código de produção)

O teste estava tentando atribuir uma **permissão restrita** (`contributions_manage`) a um membro com role **MEMBER**, o que é **proibido pelo código de produção**.

### Validação no Código de Produção

O controller `assignPermissionsController` tem uma validação que impede membros com role `MEMBER` de receberem permissões restritas:

```typescript
// Permissões que requerem pelo menos role COORDINATOR
const RESTRICTED_PERMISSIONS = [
  'finances_manage',
  'church_manage',
  'contributions_manage',  // ← Está na lista
  'members_manage'
];

// Validação
if (member.role === Role.MEMBER && requestedRestricted.length > 0) {
  return reply.code(403).send({
    message: 'Esta permissão requer pelo menos a role de Coordenador',
    error: `Membros com role MEMBER não podem receber as permissões: ${requestedRestricted.join(', ')}`,
  })
}
```

### Permissões Restritas

As seguintes permissões exigem pelo menos a role de **COORDINATOR**:
- `finances_manage`
- `church_manage`
- `contributions_manage` ← **Usada no teste incorretamente**
- `members_manage`

### Permissões Não Restritas (podem ser atribuídas a MEMBER)
- `devotional_manage`
- `members_view`
- `events_manage` ← **Usada na correção**

## ✅ Solução Aplicada

### Correção no Teste

O teste foi corrigido para usar uma **permissão não restrita** na segunda requisição:

**Antes (incorreto):**
```typescript
.send({ permissions: ['contributions_manage'] })  // ❌ Permissão restrita
```

**Depois (correto):**
```typescript
.send({ permissions: ['events_manage'] })  // ✅ Permissão não restrita
```

## 🎯 Conclusão

**O erro estava no TESTE, não no código de produção.**

- ✅ O código de produção está **correto** - ele valida adequadamente que membros com role `MEMBER` não podem receber permissões restritas
- ❌ O teste estava **incorreto** - tentava fazer algo que o código de produção não permite
- ✅ O teste foi **corrigido** para usar uma permissão adequada para um membro com role `MEMBER`

## 📊 Resumo

| Item | Status |
|------|--------|
| Código de Produção | ✅ Correto - Validação funcionando |
| Teste Original | ❌ Incorreto - Tentava violar regra de negócio |
| Teste Corrigido | ✅ Correto - Usa permissão adequada |
| Erro 403 | ✅ Comportamento esperado e correto |

## 🔒 Regras de Negócio

1. Membros com role `MEMBER` **NÃO podem** receber permissões restritas
2. Permissões restritas requerem pelo menos role `COORDINATOR`
3. A validação retorna **403 Forbidden** quando a regra é violada


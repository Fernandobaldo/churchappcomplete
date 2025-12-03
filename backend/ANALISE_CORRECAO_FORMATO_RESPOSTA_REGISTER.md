# Análise e Correção do Formato de Resposta do Endpoint /register

## 📋 Problema Identificado

Após corrigir o formato de resposta do endpoint `/register` para retornar os campos diretamente no body (conforme schema Swagger), vários testes E2E começaram a falhar porque ainda esperavam o formato antigo `{ member: ... }`.

## 🔍 Análise

### Mudança no Controller

O controller foi corrigido para retornar os campos diretamente no body para registro interno (autenticado):

**Antes (inconsistente):**
```typescript
return reply.status(201).send({ member: result })
```

**Depois (correto, conforme schema Swagger):**
```typescript
return reply.status(201).send({
  id: result.id,
  name: result.name,
  email: result.email,
  role: result.role,
  branchId: result.branchId,
  permissions: result.Permission?.map(p => ({ type: p.type })) || [],
})
```

### Formato de Resposta por Tipo de Registro

O endpoint `/register` tem diferentes formatos de resposta dependendo do contexto:

1. **Registro via Link de Convite** → Retorna `{ member: { ... }, token: "..." }`
2. **Registro Público (Landing Page)** → Retorna `{ user: { ... }, token: "..." }`
3. **Registro Interno (Autenticado - Admin criando membro)** → Retorna campos diretamente no body

### Schema Swagger

O schema documenta que para registro interno, os campos devem estar diretamente no body:

```typescript
// Campos para registro interno
id: { type: 'string' },
name: { type: 'string' },
email: { type: 'string' },
role: { type: 'string' },
branchId: { type: 'string' },
permissions: { ... }
```

## ✅ Correções Aplicadas

### 1. Correção no Controller

O controller já foi corrigido para retornar os campos diretamente no body.

### 2. Correção nos Testes E2E

Corrigidos todos os testes que esperavam `memberResult.member` para usar os campos diretamente:

**Antes (incorreto):**
```typescript
const memberResult = await createMember(...)
expect(memberResult.member).toBeDefined()
const memberId = memberResult.member.id
```

**Depois (correto):**
```typescript
const memberResult = await createMember(...)
expect(memberResult.id).toBeDefined()
const memberId = memberResult.id
```

### Arquivos Corrigidos

- ✅ `backend/src/controllers/auth/registerController.ts` - Controller retorna campos diretos
- ✅ `backend/tests/e2e/permissions-by-action.test.ts` - Todos os testes corrigidos

## 📊 Resumo das Correções

| Linha Original | Código Antigo | Código Novo |
|----------------|---------------|-------------|
| 149 | `memberResult.member.id` | `memberResult.id` |
| 200 | `memberResult.member.id` | `memberResult.id` |
| 258 | `memberResult.member.id` | `memberResult.id` |
| 319 | `memberResult.member.id` | `memberResult.id` |
| 342-343 | `newMember.member` | `newMember` |
| 346-347 | `newMember.member.id` | `newMember.id` |
| 374 | `memberResult.member.id` | `memberResult.id` |
| 418 | `memberResult.member.id` | `memberResult.id` |
| 483 | `memberResult.member.id` | `memberResult.id` |
| 551 | `memberResult.member.id` | `memberResult.id` |
| 585-586 | `newMember.member` | `newMember` |
| 589-590 | `newMember.member.id` | `newMember.id` |
| 617 | `memberResult.member.id` | `memberResult.id` |

## 🎯 Conclusão

**O problema estava nos TESTES, não no código de produção.**

- ✅ O controller estava **correto** após a primeira correção - retorna campos diretos conforme schema
- ❌ Os testes E2E estavam **desatualizados** - esperavam formato antigo `{ member: ... }`
- ✅ Todos os testes foram **corrigidos** - agora usam campos diretos conforme controller

## 📝 Nota Importante

A função `createMember` retorna `response.body` diretamente. Como o controller agora retorna os campos diretamente no body (não envoltos em `{ member: ... }`), os testes devem acessar os campos diretamente através de `memberResult.id`, `memberResult.email`, etc., não através de `memberResult.member.id`.


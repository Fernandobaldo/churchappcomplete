# Análise do Erro no Teste de Member Registration (Linhas 122-137)

## 📋 Problema Identificado

O teste `deve permitir ADMINGERAL criar membro` estava falhando com:
- **Esperado**: `response.body.email` = `'novo@example.com'`
- **Recebido**: `undefined`

## 🔍 Análise

### Erro no Código de Produção (NÃO no teste)

O controller estava retornando o membro no formato `{ member: result }`, mas o teste (e o schema Swagger) esperavam os campos diretamente no body.

### Formato de Resposta Incorreto

O controller estava retornando:
```typescript
return reply.status(201).send({ member: result })  // ❌ Formato errado
```

Mas deveria retornar os campos diretamente conforme documentado no schema Swagger:
```typescript
return reply.status(201).send({
  id: result.id,
  name: result.name,
  email: result.email,      // ✅ Campo esperado pelo teste
  role: result.role,        // ✅ Campo esperado pelo teste
  branchId: result.branchId,
  permissions: result.Permission?.map(p => ({ type: p.type })) || [],
})
```

### Schema Swagger

O schema Swagger documenta que para registro interno (autenticado), os campos devem estar diretamente no body:

```typescript
// Campos para registro interno
id: { type: 'string' },
name: { type: 'string' },
email: { type: 'string' },    // ✅ Esperado diretamente no body
role: { type: 'string' },      // ✅ Esperado diretamente no body
branchId: { type: 'string' },
permissions: { ... }
```

## ✅ Solução Aplicada

### Correção no Controller

O controller foi corrigido para retornar os campos diretamente no body, conforme o schema Swagger:

**Antes (incorreto):**
```typescript
return reply.status(201).send({ member: result })
```

**Depois (correto):**
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

## 📊 Formato de Resposta por Tipo de Registro

O endpoint `/register` tem comportamentos diferentes dependendo do contexto:

### 1. Registro via Link de Convite (Invite)
```json
{
  "member": { ... },
  "token": "..."
}
```

### 2. Registro Público (Landing Page)
```json
{
  "user": { ... },
  "token": "..."
}
```

### 3. Registro Interno (Autenticado - Admin criando membro)
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "role": "...",
  "branchId": "...",
  "permissions": [...]
}
```

## 🎯 Conclusão

**O erro estava no CÓDIGO DE PRODUÇÃO, não no teste.**

- ❌ O controller estava **incorreto** - retornava `{ member: result }` em vez dos campos diretos
- ✅ O teste estava **correto** - esperava os campos conforme documentado no schema Swagger
- ✅ O controller foi **corrigido** - agora retorna os campos diretamente no body

## 📊 Resumo

| Item | Status |
|------|--------|
| Código de Produção | ❌ Incorreto - Formato de resposta errado |
| Teste | ✅ Correto - Esperava formato documentado no schema |
| Schema Swagger | ✅ Correto - Documentava formato direto |
| Correção Aplicada | ✅ Controller ajustado para retornar campos diretamente |


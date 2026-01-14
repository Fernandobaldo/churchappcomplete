# Guia de Teste - Endpoint de Entitlements

## Endpoint

`GET /subscriptions/entitlements`

## Autenticação

Requer autenticação via Bearer token no header:
```
Authorization: Bearer <token>
```

## Resposta de Sucesso (200)

```json
{
  "features": ["events", "members", "contributions", "devotionals", "finances"],
  "limits": {
    "maxMembers": 100,
    "maxBranches": 5
  },
  "plan": {
    "id": "plan_123",
    "name": "premium",
    "code": "PREMIUM"
  },
  "hasActiveSubscription": true,
  "resolvedFrom": "self"
}
```

### Campos

- `features` (string[]): Lista de feature IDs disponíveis no plano
- `limits` (object): Limites do plano
  - `maxMembers` (number | null): Limite de membros (null = ilimitado)
  - `maxBranches` (number | null): Limite de filiais (null = ilimitado)
- `plan` (object | null): Metadados do plano
  - `id` (string): ID do plano
  - `name` (string): Nome do plano
  - `code` (string | null): Código estável do plano (ex: "FREE", "PREMIUM")
- `hasActiveSubscription` (boolean): Se o usuário tem subscription ativa
- `resolvedFrom` ("self" | "admingeral" | null): Origem dos entitlements
  - `"self"`: Do próprio subscription do usuário
  - `"admingeral"`: Fallback do subscription do ADMINGERAL
  - `null`: Sem subscription

## Resposta de Erro

### 401 Unauthorized (não autenticado)

```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Error message"
}
```

## Testes Locais

### 1. Testar com usuário autenticado

```bash
# Obter token (via login)
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.token')

# Chamar endpoint
curl -X GET http://localhost:3000/subscriptions/entitlements \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 2. Testar sem autenticação

```bash
curl -X GET http://localhost:3000/subscriptions/entitlements
# Esperado: 401 Unauthorized
```

### 3. Testar com token inválido

```bash
curl -X GET http://localhost:3000/subscriptions/entitlements \
  -H "Authorization: Bearer invalid-token"
# Esperado: 401 Unauthorized
```

## Casos de Teste

### Caso 1: Usuário com subscription própria
- **Setup**: Usuário tem subscription ativa com plano premium
- **Esperado**: 
  - `resolvedFrom: "self"`
  - `hasActiveSubscription: true`
  - Features do plano premium

### Caso 2: Usuário sem subscription mas é member
- **Setup**: Usuário é member, ADMINGERAL tem subscription premium
- **Esperado**:
  - `resolvedFrom: "admingeral"`
  - `hasActiveSubscription: true`
  - Features do plano do ADMINGERAL

### Caso 3: Usuário sem subscription e sem member
- **Setup**: Usuário não tem subscription nem é member
- **Esperado**:
  - `resolvedFrom: null`
  - `hasActiveSubscription: false`
  - `features: []`
  - `plan: null`

## Segurança

✅ **Não vaza dados sensíveis**:
- Não inclui `gatewayProvider`
- Não inclui `gatewayProductId`
- Não inclui `gatewayPriceId`
- Não inclui `price`
- Não inclui `billingInterval`
- Não inclui `syncStatus`

✅ **Validação de tenant**: Mantida (via authenticate middleware)

✅ **Type safety**: Features são filtradas para garantir apenas IDs válidos

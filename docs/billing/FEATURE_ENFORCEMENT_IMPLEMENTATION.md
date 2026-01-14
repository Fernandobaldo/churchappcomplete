# Implementação de Enforcement de Features

**Data**: 2025-01-XX  
**Status**: ✅ Implementado

## Resumo

Este documento descreve a implementação do sistema de enforcement de features de planos, transformando planos em uma camada real de autorização.

## Componentes Implementados

### 1. Catálogo Canônico de Features ✅

**Arquivo**: `backend/src/constants/planFeatures.ts`

- ✅ Catálogo fixo e estável de features
- ✅ Tipo TypeScript `PlanFeatureId` para type safety
- ✅ Funções de validação e normalização
- ✅ Categorização (basic vs premium)
- ✅ Flags `requiresEnforcement` para features premium

**Features Definidas**:
- Basic (não requerem enforcement): `events`, `members`, `contributions`, `devotionals`
- Premium (requerem enforcement): `finances`, `advanced_reports`, `white_label_app`, `export`, `api_access`
- Especial: `multi_branch` (enforced via `maxBranches` limit)

### 2. Validação de Features na Criação/Atualização ✅

**Arquivos**:
- `backend/src/services/planService.ts`
- `backend/src/services/adminPlanService.ts`

**Implementado**:
- ✅ Validação de feature IDs na criação de planos
- ✅ Normalização (lowercase, unique)
- ✅ Rejeição de features inválidas com mensagens claras
- ✅ Validação na atualização de planos

**Comportamento**:
- Features inválidas são rejeitadas com erro 400
- Features são normalizadas (lowercase, duplicatas removidas)
- Não há auto-criação ou auto-fix de planos em runtime

### 3. Camada de Resolução de Entitlements ✅

**Arquivo**: `backend/src/services/entitlementsService.ts`

**Funcionalidades**:
- ✅ `getEntitlements(userId)`: Resolve features e limites do usuário
- ✅ `hasFeature(entitlements, featureId)`: Verifica se feature está disponível
- ✅ `userHasFeature(userId, featureId)`: Conveniência para verificação direta
- ✅ Fallback automático para plano do ADMINGERAL se usuário não tem subscription

**Lógica**:
1. Busca subscription ativa do usuário
2. Se não encontrada, busca subscription do ADMINGERAL da igreja
3. Retorna features e limites do plano
4. Filtra features inválidas (segurança)

### 4. Guards de Autorização ✅

**Arquivo**: `backend/src/middlewares/requireFeature.ts`

**Implementado**:
- ✅ `requireFeature(featureId)`: Middleware que exige uma feature específica
- ✅ `requireAnyFeature(featureIds[])`: Middleware que exige qualquer uma das features

**Comportamento**:
- Retorna 403 se feature não disponível
- Mensagem clara com código de erro
- Anexa `entitlements` ao request para uso no handler

### 5. Endpoints Protegidos ✅

**Arquivo**: `backend/src/routes/financesRoutes.ts`

**Implementado**:
- ✅ Todos os endpoints `/finances/*` agora requerem feature `finances`
- ✅ Guard aplicado ANTES dos checks de role/permission
- ✅ Mantém validação de tenant (multi-tenancy)

**Endpoints Protegidos**:
- `GET /finances` - Listar transações
- `GET /finances/:id` - Obter transação
- `POST /finances` - Criar transação
- `PUT /finances/:id` - Atualizar transação
- `DELETE /finances/:id` - Excluir transação

### 6. Endpoint de Entitlements ✅

**Arquivo**: `backend/src/controllers/entitlementsController.ts`  
**Rota**: `GET /subscriptions/entitlements`

**Funcionalidade**:
- Retorna features e limites do plano atual do usuário
- Útil para frontend verificar features disponíveis
- Evita múltiplas chamadas para verificar features

**Resposta**:
```json
{
  "features": ["events", "members", "contributions"],
  "limits": {
    "maxMembers": 20,
    "maxBranches": 1
  },
  "plan": {
    "id": "...",
    "name": "free",
    "code": "FREE"
  },
  "hasActiveSubscription": true
}
```

### 7. Health Check de Planos ✅

**Arquivo**: `backend/src/utils/planHealthCheck.ts`

**Funcionalidades**:
- ✅ `checkRequiredPlans()`: Verifica se planos obrigatórios existem
- ✅ `logPlanHealthCheck()`: Loga resultados sem falhar
- ✅ Integrado no endpoint `/health`

**Comportamento**:
- NÃO cria planos automaticamente
- Apenas valida e loga warnings/erros
- Útil para detectar problemas em produção

## Fluxo de Autorização

```
1. Request → authenticate middleware
2. authenticate → requireFeature('finances')
3. requireFeature → getEntitlements(userId)
4. getEntitlements → verifica subscription + plan
5. Se feature não disponível → 403
6. Se feature disponível → continua para próximo middleware (role/permission)
```

## Segurança

✅ **Multi-tenancy preservado**: Guards de feature não substituem validação de tenant  
✅ **Fail closed**: Se resolução de entitlements falhar, acesso é negado  
✅ **Type safety**: Feature IDs são validados em tempo de compilação e runtime  
✅ **Sem auto-healing**: Planos devem ser criados corretamente via seed/admin

## Próximos Passos

### Pendente
- [ ] Aplicar `requireFeature` em outros endpoints premium:
  - `/reports` (advanced_reports)
  - `/export` (export)
  - `/api/*` (api_access)
  - White-label settings (white_label_app)
- [ ] Testes unitários para `entitlementsService`
- [ ] Testes de integração para guards
- [ ] Documentação operacional (checklist de deploy)

### Recomendações
1. Adicionar testes para verificar que usuários sem feature recebem 403
2. Adicionar testes para verificar que usuários com feature têm acesso
3. Adicionar métricas de uso de features
4. Considerar cache de entitlements para performance

## Compatibilidade

✅ **Backward compatible**: Planos existentes continuam funcionando  
✅ **Features básicas**: Não bloqueiam acesso (apenas premium)  
✅ **Limites**: Continuam funcionando como antes (maxMembers, maxBranches)

## Exemplo de Uso

```typescript
// No handler
app.get('/finances', {
  preHandler: [
    authenticate,           // 1. Autenticação
    requireFeature('finances'), // 2. Feature check
    checkBranchId(),       // 3. Tenant check
    checkRole([...]),      // 4. Role check
    checkPermission([...]), // 5. Permission check
  ],
  handler: getFinancesHandler
})
```

## Observações Importantes

1. **Stripe não foi modificado**: Integração com Stripe permanece inalterada
2. **Planos devem existir**: Não há auto-criação em produção
3. **Features são estáveis**: IDs de features não devem ser renomeados
4. **Validação é obrigatória**: Features inválidas são rejeitadas na criação/atualização

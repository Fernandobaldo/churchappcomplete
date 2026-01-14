# Integração do Portal Super Admin com Catálogo Canônico de Features

**Data**: 2025-01-XX  
**Status**: ✅ Implementado

## Resumo

Integração completa do portal Super Admin com o catálogo canônico de features do backend, garantindo que apenas features válidas possam ser selecionadas.

## Implementação Backend

### 1. Nova Rota de Features ✅

**Endpoint**: `GET /admin/plans/features`  
**Acesso**: Apenas SUPERADMIN  
**Localização**: `backend/src/routes/adminRoutes.ts`

**Handler**: `backend/src/controllers/adminController.ts:getPlanFeaturesHandler`

```typescript
export async function getPlanFeaturesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures')
    return reply.send({
      features: AVAILABLE_PLAN_FEATURES,
    })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}
```

**Resposta**:
```json
{
  "features": [
    {
      "id": "events",
      "label": "Eventos",
      "description": "Gerencie cultos e eventos",
      "category": "basic",
      "requiresEnforcement": false
    },
    {
      "id": "finances",
      "label": "Finanças",
      "description": "Controle financeiro completo",
      "category": "premium",
      "requiresEnforcement": true
    }
  ]
}
```

### 2. Validação de Desativação de Plano ✅

**Arquivo**: `backend/src/services/adminPlanService.ts`

**Implementado**:
- Validação que impede desativar plano com subscriptions ativas
- Retorna erro com mensagem clara se houver subscriptions ativas
- Mensagem inclui quantidade de subscriptions ativas

## Implementação Frontend (Portal)

### 1. Atualização do API Client ✅

**Arquivo**: `web-admin/src/api/adminApi.ts`

**Adicionado**:
```typescript
getFeatures: async () => {
  const response = await adminApi.get('/admin/plans/features')
  return response.data
},
```

### 2. Atualização do Formulário de Planos ✅

**Arquivo**: `web-admin/src/pages/Plans/PlanForm.tsx`

**Mudanças**:
- ✅ Carrega features do endpoint dedicado (`getFeatures()`)
- ✅ Agrupa features por categoria (basic/premium)
- ✅ Pré-seleciona features ao editar plano existente
- ✅ Exibe preview do plano antes de salvar
- ✅ Validação de features inválidas com mensagem amigável
- ✅ Confirmação ao remover feature (aviso sobre perda de acesso)

**Funcionalidades**:

1. **Carregamento de Features**:
   ```typescript
   const featuresResponse = await plansApi.getFeatures()
   const features = featuresResponse.features || []
   ```

2. **Agrupamento por Categoria**:
   - Features Básicas (basic)
   - Features Premium (premium)

3. **Preview do Plano**:
   - Nome
   - Preço
   - Quantidade de features selecionadas
   - Lista de features com badges

4. **Confirmação ao Remover Feature**:
   - Aviso quando removendo feature em plano existente
   - Mensagem sobre perda imediata de acesso

### 3. Componente FeatureToggle Atualizado ✅

**Arquivo**: `web-admin/src/components/FeatureToggle.tsx`

**Adicionado**:
- Badge "Protegido" para features com `requiresEnforcement: true`
- Suporte para `category` e `requiresEnforcement`

### 4. Tipos Atualizados ✅

**Arquivo**: `web-admin/src/types/index.ts`

**Interface atualizada**:
```typescript
export interface PlanFeature {
  id: string
  label: string
  description: string
  category?: 'basic' | 'premium'
  requiresEnforcement?: boolean
}
```

### 5. Tratamento de Erros ✅

**PlanForm.tsx**:
- ✅ Erro 400 com mensagem amigável para features inválidas
- ✅ Mensagem clara quando backend rejeita features

**PlanDetails.tsx**:
- ✅ Erro 409 ao tentar desativar plano com subscriptions ativas
- ✅ Mensagem clara sobre quantidade de subscriptions

## Fluxo Completo

### Criar Plano

1. Admin acessa formulário de criação
2. Sistema carrega features do catálogo (`GET /admin/plans/features`)
3. Features são agrupadas por categoria e exibidas
4. Admin seleciona features desejadas
5. Preview mostra resumo do plano
6. Ao salvar, apenas IDs das features são enviados
7. Backend valida e rejeita features inválidas se houver

### Editar Plano

1. Admin acessa formulário de edição
2. Sistema carrega plano existente e catálogo de features
3. Features do plano são pré-selecionadas
4. Admin pode adicionar/remover features
5. Ao remover feature, confirmação é solicitada
6. Preview atualizado em tempo real
7. Ao salvar, validação backend garante features válidas

### Desativar Plano

1. Admin tenta desativar plano
2. Backend verifica subscriptions ativas
3. Se houver subscriptions:
   - Retorna erro 409
   - Mensagem indica quantidade de subscriptions
4. Se não houver subscriptions:
   - Plano é desativado (soft delete via `isActive: false`)

## Segurança

✅ **Apenas SUPERADMIN** pode acessar endpoint de features  
✅ **Validação backend** garante apenas features válidas  
✅ **Mensagens claras** quando operação não pode ser realizada  
✅ **Confirmação** ao remover features de plano existente

## Testes Recomendados

1. **Criar plano** com features válidas → deve funcionar
2. **Criar plano** com feature inválida (via API direta) → deve retornar 400
3. **Editar plano** e remover feature → deve pedir confirmação
4. **Desativar plano** sem subscriptions → deve funcionar
5. **Desativar plano** com subscriptions ativas → deve retornar 409

## Arquivos Modificados

### Backend
- `backend/src/routes/adminRoutes.ts` - Rota adicionada
- `backend/src/controllers/adminController.ts` - Handler criado
- `backend/src/services/adminPlanService.ts` - Validação de desativação

### Frontend
- `web-admin/src/api/adminApi.ts` - Método `getFeatures()` adicionado
- `web-admin/src/pages/Plans/PlanForm.tsx` - Formulário atualizado
- `web-admin/src/components/FeatureToggle.tsx` - Badge de enforcement
- `web-admin/src/types/index.ts` - Tipos atualizados
- `web-admin/src/pages/Plans/PlanDetails.tsx` - Tratamento de erro 409

## Status

✅ **Implementação completa**  
✅ **Validações backend e frontend**  
✅ **UX melhorada com preview e confirmações**  
✅ **Mensagens de erro amigáveis**

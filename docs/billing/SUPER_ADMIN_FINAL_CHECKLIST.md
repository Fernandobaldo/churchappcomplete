# Checklist Final - Integração Portal Super Admin

## ✅ Implementado

### Backend

1. **Rota de Features** ✅
   - [x] `GET /admin/plans/features` criada
   - [x] Handler `getPlanFeaturesHandler` implementado
   - [x] Protegida para SUPERADMIN apenas
   - [x] Retorna `AVAILABLE_PLAN_FEATURES` completo

2. **Validação de Desativação** ✅
   - [x] `deactivatePlan()` verifica subscriptions ativas
   - [x] Retorna erro se houver subscriptions
   - [x] Mensagem clara com quantidade

3. **Handler de Erro** ⚠️ **VERIFICAR**
   - [ ] Handler `deactivatePlanHandler` deve retornar 409 quando `deactivatePlan` lança erro
   - [ ] Verificar se há try/catch que converte erro em 409

### Frontend (Portal)

1. **API Client** ✅
   - [x] Método `getFeatures()` adicionado em `adminApi.ts`

2. **Formulário de Planos** ✅
   - [x] Carrega features do endpoint dedicado
   - [x] Features agrupadas por categoria (basic/premium)
   - [x] Pré-seleção ao editar
   - [x] Preview do plano adicionado
   - [x] Confirmação ao remover feature
   - [x] Tratamento de erro para features inválidas

3. **Componente FeatureToggle** ✅
   - [x] Badge "Protegido" para features premium
   - [x] Suporte a category e requiresEnforcement

4. **Tipos** ✅
   - [x] `PlanFeature` atualizado com category e requiresEnforcement

5. **PlanDetails** ✅
   - [x] Tratamento de erro 409 ao desativar

## ⚠️ Verificação Necessária

### Handler de Desativação

Verificar se `deactivatePlanHandler` em `adminController.ts` trata erro corretamente:

```typescript
export async function deactivatePlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const plan = await planService.deactivatePlan(id, adminUserId, req)
    return reply.send(plan)
  } catch (error: any) {
    // Deve retornar 409 se erro contém informação sobre subscriptions
    if (error.message?.includes('assinatura') || error.message?.includes('subscription')) {
      return reply.status(409).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}
```

## 📝 Testes Recomendados

1. **Criar plano** via portal → deve usar catálogo canônico
2. **Editar plano** e remover feature → deve pedir confirmação
3. **Desativar plano** sem subscriptions → deve funcionar
4. **Desativar plano** com subscriptions → deve retornar 409

## 📋 Status

✅ **Backend**: Rota de features criada  
✅ **Backend**: Validação de desativação implementada  
✅ **Frontend**: Formulário atualizado  
✅ **Frontend**: Preview e confirmações implementadas  
⚠️ **Backend**: Verificar handler de desativação retorna 409 corretamente

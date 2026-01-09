# Plano de Execução: Melhorias do Fluxo de Criação de Conta

**Data:** 2025-01-09  
**Baseado em:** `docs/ai/ACCOUNT_FLOW_IMPROVEMENT_PLAN.md`  
**Objetivo:** Implementar melhorias críticas das Fases 0 e 1

---

## Estratégia de Execução

- Implementar uma fase por vez
- Validar cada item antes de prosseguir
- Manter mudanças incrementais e de baixo risco
- Não modificar layouts (guards apenas em navegação)

---

## FASE 0: Quick Wins

### Item 0.1: Atualizar Token após Criar Igreja no RegisterScreen

**Arquivo:** `mobile/src/screens/RegisterScreen.tsx`

**Mudanças necessárias:**

1. **Linha 90-94 (primeiro bloco de criação de igreja):**
   - Após `api.post('/churches')` bem-sucedido, verificar se `response.data.token` existe
   - Se existir, chamar `setUserFromToken(response.data.token)` antes do Toast
   - Armazenar resposta em variável para acessar `data.token`

2. **Linha 149-153 (segundo bloco de criação de igreja):**
   - Aplicar a mesma mudança

**Código a modificar:**

```typescript
// ANTES (linha ~90-94):
await api.post('/churches', {
  name: churchName,
  withBranch: true,
  branchName: 'Sede',
})
Toast.show({
  type: 'success',
  text1: 'Conta e igreja criadas com sucesso!',
})

// DEPOIS:
const churchResponse = await api.post('/churches', {
  name: churchName,
  withBranch: true,
  branchName: 'Sede',
})

// Atualizar token se retornado (padrão do ChurchScreen.tsx)
if (churchResponse.data.token) {
  setUserFromToken(churchResponse.data.token)
}

Toast.show({
  type: 'success',
  text1: 'Conta e igreja criadas com sucesso!',
})
```

**Aplicar a mesma mudança no segundo bloco (linha ~149-153).**

**Validação:**
- Após criar conta e igreja, verificar que token no store contém `memberId`, `branchId`, `role`
- Testar navegação para `StartOnboarding` funciona com token atualizado
- Padrão idêntico ao usado em `ChurchScreen.tsx` (linha 81-82)

---

### Item 0.2: Guard Global de Navegação (memberId/branchId/role)

**Arquivo:** `mobile/src/navigation/AppNavigator.tsx`

**Mudanças necessárias:**

1. **Adicionar import:**
   ```typescript
   import { useAuthStore } from '../stores/authStore'
   ```

2. **Modificar função `AppNavigator`:**
   - Adicionar hook `useAuthStore` no início da função
   - Verificar `user?.memberId`, `user?.branchId`, `user?.role`
   - Se qualquer um estiver ausente, renderizar apenas rotas de onboarding
   - Se todos presentes, renderizar navegador completo

**Código a modificar:**

```typescript
// ANTES (linha 56-133):
export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{...}}>
                {/* Todas as rotas */}
            </Stack.Navigator>
        </NavigationContainer>
    )
}

// DEPOIS:
export default function AppNavigator() {
    const { user } = useAuthStore()
    
    // Guard: verificar se user tem Member completo
    const hasCompleteMember = user?.memberId && user?.branchId && user?.role
    
    // Se não tem Member completo, renderizar apenas rotas de onboarding
    if (!hasCompleteMember) {
        return (
            <NavigationContainer>
                <Stack.Navigator 
                    initialRouteName="StartOnboarding" 
                    screenOptions={{animation: 'slide_from_right', headerShown: false}}
                >
                    <Stack.Screen name="StartOnboarding" component={StartOnboardingScreen} />
                    <Stack.Screen name="ChurchOnboarding" component={ChurchOnboardingScreen} />
                    <Stack.Screen name="BranchesOnboarding" component={BranchesOnboardingScreen} />
                    <Stack.Screen name="SettingsOnboarding" component={SettingsScreen} />
                    <Stack.Screen name="ConvitesOnboarding" component={ConvitesScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        )
    }
    
    // Se tem Member completo, renderizar navegador completo
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{animation: 'slide_from_right', headerShown: false }}>
                {/* Todas as rotas existentes (manter como está) */}
            </Stack.Navigator>
        </NavigationContainer>
    )
}
```

**Validação:**
- Fazer login com user sem Member → deve redirecionar para StartOnboarding
- Completar onboarding → deve permitir acesso a Main
- Tentar navegar para Main sem Member → guard deve bloquear
- Guard está apenas em `AppNavigator.tsx` (não em layouts)

---

### Item 0.3: Remover Validação Client-Side de Expiração de Invite Link

**Arquivo:** `mobile/src/screens/RegisterInviteScreen.tsx`

**Mudanças necessárias:**

1. **Linha 81-85:** Remover bloco que valida `expiresAt` no client
2. Manter apenas validação de `isActive` (linha 75-79) e `maxUses` (linha 87-92)

**Código a modificar:**

```typescript
// ANTES (linha 70-92):
const validateToken = async () => {
  try {
    const response = await api.get(`/invite-links/${token}/info`)
    setLinkInfo(response.data)

    if (!response.data.isActive) {
      setError('Este link de convite foi desativado')
      setValidating(false)
      return
    }

    // REMOVER ESTE BLOCO (linha 81-85):
    if (response.data.expiresAt && new Date(response.data.expiresAt) < new Date()) {
      setError('Este link de convite expirou')
      setValidating(false)
      return
    }

    if (
      response.data.maxUses !== null &&
      response.data.currentUses >= response.data.maxUses
    ) {
      setError('Este link de convite atingiu o limite de usos')
      setValidating(false)
      return
    }
    // ...
  }
}

// DEPOIS:
const validateToken = async () => {
  try {
    const response = await api.get(`/invite-links/${token}/info`)
    setLinkInfo(response.data)

    if (!response.data.isActive) {
      setError('Este link de convite foi desativado')
      setValidating(false)
      return
    }

    // Validação de expiresAt removida - backend é a única fonte de verdade

    if (
      response.data.maxUses !== null &&
      response.data.currentUses >= response.data.maxUses
    ) {
      setError('Este link de convite atingiu o limite de usos')
      setValidating(false)
      return
    }
    // ...
  }
}
```

**Validação:**
- Testar com link expirado → backend deve retornar erro e exibir mensagem corretamente
- Validação de `isActive` e `maxUses` ainda funciona no client
- Backend é a única fonte de verdade para expiração

---

## FASE 1: Critical Stability/Security Fixes

### Item 1.1: Tornar Onboarding Obrigatório (Reforçar Guard)

**Arquivo:** `mobile/src/screens/onboarding/SettingsScreen.tsx`

**Mudanças necessárias:**

1. **Linha ~100-118 (função `handleFinishOnboarding`):**
   - Adicionar verificação de `user?.memberId`, `user?.branchId`, `user?.role` antes de navegar
   - Se não existir, mostrar Toast de erro e não navegar
   - Guard global (Item 0.2) já previne acesso, mas esta verificação adiciona feedback claro

**Código a modificar:**

```typescript
// ANTES (linha ~100-118):
const handleFinishOnboarding = async () => {
  // ... código existente ...
  
  // Finaliza onboarding
  navigation.navigate('Main' as never)
}

// DEPOIS:
const handleFinishOnboarding = async () => {
  // ... código existente ...
  
  // Verificar se Member completo existe antes de navegar
  const userData = useAuthStore.getState().user
  if (!userData?.memberId || !userData?.branchId || !userData?.role) {
    Toast.show({
      type: 'error',
      text1: 'Onboarding incompleto',
      text2: 'Complete a configuração da igreja primeiro.',
    })
    return // Não navegar - guard global também bloqueará
  }
  
  // Se tem Member completo, navegar
  navigation.navigate('Main' as never)
}
```

**Validação:**
- Tentar "pular" onboarding → Toast de erro deve aparecer
- Guard global também deve bloquear acesso a Main
- Registro público continua criando apenas User (sem Member)

---

### Item 1.2: 401 Interceptor com Navigation Ref

**Arquivos:**
- `mobile/src/navigation/navigationRef.ts` (NOVO)
- `mobile/src/navigation/AppNavigator.tsx` (conectar ref)
- `mobile/src/api/api.ts` (usar ref no interceptor)

**Mudanças necessárias:**

**1. Criar `mobile/src/navigation/navigationRef.ts` (NOVO ARQUIVO):**

```typescript
import { createNavigationContainerRef } from '@react-navigation/native'
import { removeToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'

export const navigationRef = createNavigationContainerRef()

export function resetToLogin() {
  removeToken()
  useAuthStore.getState().logout()
  
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    })
  }
}
```

**2. Modificar `mobile/src/navigation/AppNavigator.tsx`:**

```typescript
// Adicionar import no topo
import { navigationRef } from './navigationRef'

// Modificar NavigationContainer para conectar ref (linha 58):
// ANTES:
<NavigationContainer>

// DEPOIS:
<NavigationContainer ref={navigationRef}>
```

**3. Modificar `mobile/src/api/api.ts`:**

```typescript
// Adicionar import no topo (após linha 4):
import { resetToLogin } from '../navigation/navigationRef'

// Modificar interceptor de 401 (linha 100-104):
// ANTES:
if (error.response?.status === 401) {
  removeToken()
  useAuthStore.getState().logout()
}

// DEPOIS:
if (error.response?.status === 401) {
  resetToLogin()
}
```

**Validação:**
- Simular token expirado (modificar token manualmente) → deve redirecionar para Login
- Stack de navegação deve ser limpa (não pode voltar para tela anterior)
- Token e store devem ser limpos antes de redirecionar
- Navegação funciona mesmo fora de contexto React (interceptors)

---

### Item 1.3: Validação de Plano com Código Estável

**Arquivos:**
- `backend/prisma/schema.prisma` (adicionar campo `code`)
- `backend/prisma/migrations/` (criar migration)
- `backend/prisma/seed.ts` (adicionar `code: 'FREE'`)
- `backend/src/utils/planLimits.ts` (buscar por `code`)

**Mudanças necessárias:**

**1. Modificar `backend/prisma/schema.prisma` (linha 172-186):**

```prisma
model Plan {
  id               String         @id @default(cuid())
  name             String         @unique
  code             String?        @unique // NOVO: código estável
  price            Float
  features         String[]
  maxBranches      Int?
  maxMembers       Int?
  isActive         Boolean        @default(true)
  gatewayProvider  String?
  gatewayProductId String?
  gatewayPriceId   String?
  billingInterval  String         @default("month")
  syncStatus       String         @default("pending")
  Subscription     Subscription[]
}
```

**2. Criar migration:**

```bash
cd backend
npx prisma migrate dev --name add_plan_code
```

**3. Modificar `backend/prisma/seed.ts` (linha 40-56):**

```typescript
// ANTES (linha 41-56):
await prisma.plan.create({
  data: {
    name: 'free',
    price: 0,
    features: validFreePlanFeatures,
    maxBranches: 1,
    maxMembers: 20,
    // ...
  },
})

// DEPOIS:
await prisma.plan.create({
  data: {
    name: 'free',
    code: 'FREE', // ADICIONAR código estável
    price: 0,
    features: validFreePlanFeatures,
    maxBranches: 1,
    maxMembers: 20,
    // ...
  },
})
```

**4. Modificar `backend/src/utils/planLimits.ts` (linha ~50-120):**

```typescript
// Buscar por code primeiro, depois fallback para name (backward compatibility)
let plan = await prisma.plan.findFirst({
  where: { code: 'FREE' }
})

// Se não encontrar por code, tentar por name (backward compatibility)
if (!plan) {
  plan = await prisma.plan.findFirst({
    where: {
      OR: [
        { name: 'free' },
        { name: 'Free' },
        { name: 'Free Plan' },
      ],
    },
  })
}

// Se ainda não encontrar, lançar erro claro (NÃO auto-criar)
if (!plan) {
  throw new Error('Plano Free não encontrado. Execute seed ou verifique banco de dados.')
}
```

**Aplicar a mesma lógica em `checkPlanBranchesLimit()` se necessário.**

**Validação:**
- Verificar que plano Free tem `code: 'FREE'` no banco (SQL: `SELECT code, name FROM "Plan" WHERE code = 'FREE'`)
- Validação de limites funciona corretamente
- Não há lógica de auto-criação/upsert de planos em fluxos críticos
- Seed garante que plano Free existe em dev/test

---

### Item 1.4: Checklist Pré-Deploy para Planos

**Arquivo:** `docs/DEPLOY_CHECKLIST.md` (NOVO ou adicionar seção)

**Mudanças necessárias:**

1. Criar arquivo `docs/DEPLOY_CHECKLIST.md` com seção de verificação de planos
2. Incluir comando SQL para verificar planos
3. Incluir instruções para executar seed se necessário

**Conteúdo do arquivo:**

```markdown
# Checklist Pré-Deploy

## Verificação de Planos

Antes de fazer deploy em produção, verificar que planos existem:

```sql
SELECT code, name, "maxMembers", "maxBranches" FROM "Plan" WHERE code = 'FREE';
```

Se não retornar resultados, executar seed:

```bash
cd backend
npm run seed
```

**Importante:** Em produção, planos sempre existem (DB não é resetado). Este checklist é para garantir antes do primeiro deploy.

## Outras Verificações

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Testes passando
- [ ] Health check (se implementado) retorna sucesso
```

**Validação:**
- Documento existe e contém instruções claras
- Comando SQL funciona corretamente
- Instruções são claras para equipe de deploy

---

## Ordem de Execução Recomendada

### Dia 1: Fase 0 (Quick Wins)
1. **Item 0.1** (Token update) - ~30 min
2. **Item 0.3** (Remover validação client-side) - ~15 min
3. **Item 0.2** (Guard global) - ~1 hora
4. **Validação Fase 0** - ~30 min

### Dia 2-3: Fase 1 (Críticos)
1. **Item 1.1** (Onboarding obrigatório) - ~30 min
2. **Item 1.2** (401 interceptor) - ~2 horas
3. **Item 1.3** (Plano código estável) - ~3-4 horas
4. **Item 1.4** (Checklist) - ~1 hora
5. **Validação Fase 1** - ~1 hora

**Total estimado:** 2-3 dias

---

## Validação Final

Após implementar todos os itens das Fases 0 e 1:

- [ ] **Registro Padrão:** Token é atualizado após criar igreja
- [ ] **Guard Global:** Não é possível acessar `Main` sem Member
- [ ] **Invite Link:** Validação de expiração funciona apenas no backend
- [ ] **Onboarding:** Não é possível pular sem completar
- [ ] **Token Expirado:** Redirecionamento para Login funciona automaticamente
- [ ] **Limite de Plano:** Validação funciona com código estável
- [ ] **Checklist:** Documentação pré-deploy está completa

---

## Notas Importantes

- **NÃO modificar layouts:** `ViewScreenLayout`, `DetailScreenLayout`, `FormScreenLayout` não devem ter guards
- **Guards apenas em navegação:** `AppNavigator.tsx` é o único lugar para guards de navegação
- **Token como source of truth:** Sempre atualizar token quando contexto de membership muda
- **Backward compatibility:** Manter fallback para `name` em busca de planos (temporário, para compatibilidade)
- **Incremental:** Implementar um item por vez e validar antes de prosseguir

---

## Próximos Passos (Fases 2 e 3)

Após validar Fases 0 e 1, considerar implementar:
- **Fase 2:** Refresh token (Item 2.1), Limpeza AsyncStorage (Item 2.2)
- **Fase 3:** SettingsOnboarding completo (Item 3.1), Observabilidade (Item 3.2)

**Fim do Plano de Execução**


# Relatório "As-Is": Fluxo de Criação de Conta → Onboarding → Acesso ao App

**Data:** 2025-02-01  
**Projeto:** ChurchApp (White-label)  
**Stack:** Backend (Fastify + Prisma) + Mobile (Expo/React Native) + Web (React/Vite)  
**Status:** Documentação atualizada após refatoração completa do onboarding

---

## 📋 Sumário Executivo

### O que funciona:
- ✅ Registro público cria User + Subscription (plano Free)
- ✅ Login autentica User e retorna JWT com dados de Member (se existir) + `onboardingCompleted`
- ✅ Onboarding obrigatório com rastreamento de progresso (`OnboardingProgress`)
- ✅ Prevenção de duplicação de igreja via `createdByUserId`
- ✅ Onboarding idempotente e resumível
- ✅ Token atualizado automaticamente após mudanças de contexto (Member/Branch)
- ✅ Guards de navegação baseados em `memberId`, `branchId`, `role` e `onboardingCompleted`
- ✅ Validação de limites de plano (maxMembers, maxBranches)

### Estados do Onboarding:
- **NEW**: Usuário não tem igreja criada
- **PENDING**: Usuário tem igreja criada mas onboarding não completo
- **COMPLETE**: Usuário tem Member completo e onboarding marcado como completo

---

## 🗄️ Modelo de Dados

### Schema Prisma (Relevante)

```prisma
model User {
  id                 String              @id @default(cuid())
  email              String              @unique
  firstName          String
  lastName           String
  password           String
  // ...
  Member             Member?
  CreatedChurches    Church[]            @relation("ChurchCreator")
  OnboardingProgress OnboardingProgress?
}

model Church {
  id              String   @id @default(cuid())
  name            String
  createdByUserId String?  // FK para User - determina ownership
  User            User?    @relation("ChurchCreator", fields: [createdByUserId], references: [id])
  Branch          Branch[]
  // ...
}

model Branch {
  id           String   @id @default(cuid())
  name         String
  churchId     String
  isMainBranch Boolean  @default(false)
  Church       Church   @relation(fields: [churchId], references: [id])
  Member       Member[]
  // ...
}

model Member {
  id       String   @id @default(cuid())
  name     String
  email    String   @unique
  role     Role     @default(MEMBER)
  branchId String
  userId   String?  @unique
  Branch   Branch   @relation(fields: [branchId], references: [id])
  User     User?    @relation(fields: [userId], references: [id])
  // ...
}

model OnboardingProgress {
  id                 String   @id @default(cuid())
  userId             String   @unique
  churchConfigured   Boolean  @default(false)
  branchesConfigured Boolean  @default(false)
  settingsConfigured Boolean  @default(false)
  completed          Boolean  @default(false)
  completedAt        DateTime?
  User               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ...
}
```

### Relacionamentos Críticos:
- `User.createdByUserId` → `Church.createdByUserId` (ownership)
- `User.id` → `OnboardingProgress.userId` (1:1)
- `User.id` → `Member.userId` (1:1)
- `Member.branchId` → `Branch.id` (obrigatório)
- `Branch.churchId` → `Church.id` (obrigatório)

---

## 🔄 Fluxo Completo: Registro → Onboarding → Acesso

### Fase 1: Registro de Conta

#### 1.1 Registro Público (Landing/App)

**Endpoint:** `POST /register` ou `POST /public/register`

**Fluxo:**
1. Usuário preenche: `firstName`, `lastName`, `email`, `password`
2. Backend cria `User` no banco
3. Backend cria `Subscription` com plano Free (se não existir)
4. Backend gera JWT token com:
   - `userId`, `email`, `name`
   - `memberId`: `null`
   - `branchId`: `null`
   - `role`: `null`
   - `onboardingCompleted`: `false` (verifica `OnboardingProgress`)
   - `permissions`: `[]`
5. Mobile armazena token em `AsyncStorage` via `authStore`
6. `AppNavigator` detecta: `authenticated = true`, `canAccessMain = false`
7. **Redireciona para onboarding** (não para Dashboard)

**Arquivos:**
- Backend: `backend/src/controllers/auth/registerController.ts`
- Mobile: `mobile/src/screens/RegisterScreen.tsx`
- Store: `mobile/src/stores/authStore.ts`

---

### Fase 2: Onboarding

#### 2.1 Guard de Navegação (AppNavigator)

**Arquivo:** `mobile/src/navigation/AppNavigator.tsx`

**Lógica:**
```typescript
const authenticated = isAuthenticated() // Token válido e não expirado
const hasCompleteMember = user?.memberId && user?.branchId && user?.role
const onboardingCompleted = user?.onboardingCompleted === true
const canAccessMain = hasCompleteMember && onboardingCompleted

// Se não autenticado → Login Navigator
if (!authenticated) { /* Login Navigator */ }

// Se autenticado mas sem acesso completo → Onboarding Navigator
if (!canAccessMain) { /* Onboarding Navigator */ }

// Se tem acesso completo → Main Navigator
if (canAccessMain) { /* Main Navigator */ }
```

**Estados possíveis:**
- `authenticated = false` → Login
- `authenticated = true`, `canAccessMain = false` → Onboarding
- `authenticated = true`, `canAccessMain = true` → Main App

---

#### 2.2 Início do Onboarding (StartScreen)

**Arquivo:** `mobile/src/screens/onboarding/StartScreen.tsx`

**Fluxo:**
1. Ao montar, chama `GET /onboarding/state`
2. Backend retorna:
   - `status: 'NEW'` → Usuário não tem igreja
   - `status: 'PENDING'` → Usuário tem igreja mas onboarding incompleto
   - `status: 'COMPLETE'` → Usuário tem Member completo (não deveria chegar aqui)
3. Se `PENDING`:
   - Preenche `AsyncStorage` com dados da igreja para prefill
   - Detecta estrutura (simple/branches) baseado em existência de Branch
4. Usuário escolhe estrutura:
   - **Simple**: Uma igreja sem filiais
   - **Branches**: Igreja com múltiplas filiais
   - **Existing**: Entrar em igreja existente (não implementado)

**Endpoint Backend:** `GET /onboarding/state`
- Verifica `memberId` e `branchId` no token
- Se ambos existem → `COMPLETE`
- Se não, busca `Church` via `createdByUserId`
- Se encontra → `PENDING` com dados da igreja
- Se não encontra → `NEW`

---

#### 2.3 Configuração da Igreja (ChurchScreen)

**Arquivo:** `mobile/src/screens/onboarding/ChurchScreen.tsx`

**Fluxo:**
1. Carrega dados existentes (se `PENDING`):
   - Chama `GET /churches` para validar ownership
   - Preenche campos se igreja existe e pertence ao usuário
2. Usuário preenche: `name`, `address` (opcional)
3. Ao submeter:
   - **Se igreja existe**: `PUT /churches/:id` (atualiza)
   - **Se igreja não existe**: `POST /churches` (cria)
4. Backend (`POST /churches`):
   - **Verifica duplicação**: Busca `Church` via `createdByUserId`
   - **Se existe**: Retorna igreja existente (200 OK) + cria/atualiza Branch/Member se necessário
   - **Se não existe**: Cria nova igreja
   - **Sempre cria**: Branch principal ("Sede") + Member (ADMINGERAL) + Permissions
   - **Retorna**: Token atualizado com `memberId`, `branchId`, `role`, `onboardingCompleted`
5. Mobile:
   - Atualiza token via `setUserFromToken(response.data.token)`
   - Marca progresso: `POST /onboarding/progress/church`
   - Salva dados em `AsyncStorage` para prefill futuro
6. Navegação:
   - Se estrutura = "branches" → `BranchesOnboarding`
   - Se estrutura = "simple" → `SettingsOnboarding` (pula branches)

**Prevenção de Duplicação:**
- Backend verifica `createdByUserId` antes de criar
- Se igreja existe, retorna existente (idempotente)
- Frontend valida ownership antes de usar dados de `AsyncStorage`

**Endpoints Backend:**
- `POST /churches` - Cria ou retorna igreja existente
- `PUT /churches/:id` - Atualiza igreja (permite se `createdByUserId` = userId)
- `POST /onboarding/progress/church` - Marca etapa como completa

---

#### 2.4 Configuração de Filiais (BranchesScreen) - Opcional

**Arquivo:** `mobile/src/screens/onboarding/BranchesScreen.tsx`

**Fluxo:**
1. Carrega filiais existentes via `GET /churches`
2. Usuário adiciona/edita filiais
3. Ao submeter:
   - Cria/atualiza filiais via `POST /branches` ou `PUT /branches/:id`
4. Marca progresso: `POST /onboarding/progress/branches`
5. Navega para `SettingsOnboarding`

**Nota:** Esta tela só aparece se estrutura = "branches". Para "simple", a branch principal já foi criada automaticamente.

**Endpoints Backend:**
- `GET /churches` - Retorna igreja com filiais
- `POST /branches` - Cria nova filial
- `PUT /branches/:id` - Atualiza filial
- `POST /onboarding/progress/branches` - Marca etapa como completa

---

#### 2.5 Configuração de Settings (SettingsScreen)

**Arquivo:** `mobile/src/screens/onboarding/SettingsScreen.tsx`

**Fluxo:**
1. **Step 1**: Roles e Permissões
   - Cria roles padrão (salva em `AsyncStorage`)
   - Marca `onboarding_roles_created = true`
2. **Step 2**: Módulos
   - Seleciona módulos ativos (events, members, contributions, etc.)
   - Salva em `AsyncStorage`
3. **Step 3**: Links de Convite (informativo)
   - Apenas exibe informação sobre criação de links
4. Ao finalizar Step 3:
   - Marca progresso: `POST /onboarding/progress/settings`
   - Navega para `ConcluidoOnboarding`

**Endpoints Backend:**
- `POST /onboarding/progress/settings` - Marca etapa como completa

---

#### 2.6 Conclusão do Onboarding (ConcluidoScreen)

**Arquivo:** `mobile/src/screens/onboarding/ConcluidoScreen.tsx`

**Fluxo:**
1. Usuário clica "Ir para o painel"
2. Chama `POST /onboarding/complete`
3. Backend:
   - Marca `OnboardingProgress.completed = true`
   - Marca `OnboardingProgress.completedAt = now()`
   - Gera novo token com `onboardingCompleted = true`
   - Retorna token atualizado
4. Mobile:
   - Atualiza token via `setUserFromToken(response.data.token)`
   - `AppNavigator` detecta `canAccessMain = true`
   - **Redireciona automaticamente para Main App**

**Endpoint Backend:**
- `POST /onboarding/complete` - Marca onboarding como completo e retorna token atualizado

---

### Fase 3: Acesso ao App Principal

#### 3.1 Guard de Acesso (AppNavigator)

**Condições para acesso:**
- `authenticated = true` (token válido)
- `hasCompleteMember = true` (`memberId`, `branchId`, `role` presentes)
- `onboardingCompleted = true` (marcado no token)

**Se todas condições verdadeiras:**
- Renderiza `Main Navigator` com `TabNavigator`
- Usuário acessa Dashboard e funcionalidades completas

---

## 🔐 Segurança e Ownership

### Church Ownership

**Como é determinado:**
- Campo `Church.createdByUserId` armazena ID do User que criou a igreja
- Backend verifica ownership antes de permitir edição
- Frontend valida ownership antes de usar dados de `AsyncStorage`

**Regras:**
- Usuário pode editar igreja se `createdByUserId = userId` (mesmo sem Member completo)
- `GET /churches` retorna apenas igreja do usuário (via `createdByUserId` ou `Member.Branch.Church`)
- Prevenção de acesso a dados de outros tenants

### Token Security

**Conteúdo do Token JWT:**
```typescript
{
  sub: string,              // User ID
  email: string,
  name: string,
  type: 'user' | 'member',
  memberId?: string,         // Presente se Member existe
  branchId?: string,         // Presente se Member existe
  role?: string,             // Presente se Member existe
  churchId?: string,         // Presente se Member existe
  permissions: string[],     // Array de tipos de permissão
  onboardingCompleted: boolean // Status do onboarding
}
```

**Atualização de Token:**
- Após criar/atualizar igreja → Token atualizado com Member
- Após completar onboarding → Token atualizado com `onboardingCompleted = true`
- Após login → Token inclui `onboardingCompleted` do `OnboardingProgress`

---

## 🔄 Idempotência e Resumo

### Prevenção de Duplicação de Igreja

**Backend (`churchController.create`):**
1. Busca `Church` via `createdByUserId`
2. Se existe → Retorna existente (200 OK)
3. Se não existe → Cria nova
4. **Sempre** cria/atualiza Branch e Member se necessário

**Resultado:** Usuário nunca pode ter mais de uma igreja "pending" criada por ele.

### Resumo de Onboarding

**Como funciona:**
1. `StartScreen` chama `GET /onboarding/state`
2. Se `PENDING`:
   - Backend retorna dados da igreja existente
   - Frontend preenche campos automaticamente
   - Usuário continua de onde parou
3. Progresso é mantido em `OnboardingProgress`:
   - `churchConfigured`: Marca após criar/atualizar igreja
   - `branchesConfigured`: Marca após salvar filiais (ou automaticamente para "simple")
   - `settingsConfigured`: Marca após finalizar settings
   - `completed`: Marca apenas quando usuário clica "Ir para o painel"

**Validação de Dados:**
- Frontend valida ownership antes de usar `AsyncStorage`
- Se dados não pertencem ao usuário → Limpa `AsyncStorage`
- Backend sempre valida ownership antes de retornar dados

---

## 📱 Responsabilidades: Backend vs Mobile

### Backend

**Responsabilidades:**
- Criar/atualizar `User`, `Church`, `Branch`, `Member`
- Prevenir duplicação de igreja via `createdByUserId`
- Gerenciar `OnboardingProgress` (criar, atualizar, verificar)
- Gerar tokens JWT atualizados após mudanças de contexto
- Validar ownership e permissões
- Retornar estado de onboarding (`NEW`, `PENDING`, `COMPLETE`)

**Endpoints Principais:**
- `POST /register` - Criar conta
- `POST /auth/login` - Login
- `GET /onboarding/state` - Estado do onboarding
- `GET /onboarding/progress` - Progresso detalhado
- `POST /onboarding/progress/:step` - Marcar etapa completa
- `POST /onboarding/complete` - Marcar onboarding completo
- `POST /churches` - Criar/retornar igreja (idempotente)
- `PUT /churches/:id` - Atualizar igreja
- `GET /churches` - Listar igrejas do usuário

### Mobile

**Responsabilidades:**
- Gerenciar navegação baseada em estado de autenticação
- Chamar endpoints de onboarding na ordem correta
- Atualizar token quando recebido do backend
- Preencher campos com dados existentes (prefill)
- Validar ownership antes de usar `AsyncStorage`
- Limpar `AsyncStorage` no logout

**Componentes Principais:**
- `AppNavigator` - Guard de navegação global
- `StartScreen` - Verifica estado e inicia onboarding
- `ChurchScreen` - Cria/atualiza igreja
- `BranchesScreen` - Configura filiais (opcional)
- `SettingsScreen` - Configura roles, módulos, links
- `ConcluidoScreen` - Finaliza onboarding
- `authStore` - Gerencia estado de autenticação

---

## 🎯 Estados e Transições

### Diagrama de Estados (Texto)

```
[NEW]
  │
  │ POST /churches
  ▼
[PENDING - churchConfigured=true]
  │
  │ POST /onboarding/progress/branches (ou automático para "simple")
  ▼
[PENDING - branchesConfigured=true]
  │
  │ POST /onboarding/progress/settings
  ▼
[PENDING - settingsConfigured=true]
  │
  │ POST /onboarding/complete
  ▼
[COMPLETE - completed=true]
  │
  │ AppNavigator detecta canAccessMain=true
  ▼
[MAIN APP]
```

### Estados no Banco de Dados

**OnboardingProgress:**
- `churchConfigured`: `false` → `true` (após criar/atualizar igreja)
- `branchesConfigured`: `false` → `true` (após salvar filiais ou automaticamente para "simple")
- `settingsConfigured`: `false` → `true` (após finalizar settings)
- `completed`: `false` → `true` (apenas quando usuário finaliza explicitamente)

**Token JWT:**
- `onboardingCompleted`: `false` → `true` (apenas quando `OnboardingProgress.completed = true`)

---

## 🔍 Validações e Edge Cases

### Validação de Ownership

**Frontend (`ChurchScreen`):**
- Antes de usar dados de `AsyncStorage`, valida via `GET /churches`
- Se igreja não pertence ao usuário → Limpa `AsyncStorage`

**Backend (`churchController`):**
- `GET /churches` retorna apenas igreja do usuário
- `PUT /churches/:id` permite edição se `createdByUserId = userId`

### Limpeza de Dados

**Logout (`authStore.logout`):**
- Limpa `user` e `token`
- Limpa `AsyncStorage`:
  - `onboarding_church_id`
  - `onboarding_church_name`
  - `onboarding_church_address`
  - `onboarding_structure`
  - `onboarding_modules`
  - `onboarding_roles_created`

**Motivo:** Prevenir vazamento de dados entre usuários (multi-tenancy)

---

## 📊 Fluxo de Token

### Quando o Token é Atualizado

1. **Após criar igreja** (`POST /churches`):
   - Backend cria Member e Branch
   - Gera token com `memberId`, `branchId`, `role`
   - `onboardingCompleted` = status atual do `OnboardingProgress`

2. **Após atualizar igreja** (`PUT /churches/:id`):
   - Se Member não existe, cria
   - Gera token atualizado
   - `onboardingCompleted` = status atual

3. **Após completar onboarding** (`POST /onboarding/complete`):
   - Marca `OnboardingProgress.completed = true`
   - Gera token com `onboardingCompleted = true`

4. **Após login** (`POST /auth/login`):
   - Busca `OnboardingProgress.completed`
   - Inclui `onboardingCompleted` no token

### Onde o Token é Atualizado no Mobile

- `ChurchScreen`: `setUserFromToken(response.data.token)`
- `ConcluidoScreen`: `setUserFromToken(response.data.token)`
- `LoginScreen`: `setUserFromToken(token)` (após login)

---

## 🚨 Account Flow Invariants (Must Never Break)

Esta seção documenta invariantes críticos do sistema que **NUNCA** devem ser violados. Estes invariantes devem ser usados como:
- Critérios de aceitação para testes
- Checklist de regressão
- Validação em code reviews

### Invariantes de Segurança

#### INV-1: Isolamento Multi-Tenancy
**Descrição:** Um usuário nunca pode acessar dados de outro tenant (igreja).

**Enforcement:**
- Backend: `GET /churches` retorna apenas igreja do usuário (via `createdByUserId` ou `Member.Branch.Church`)
- Frontend: Valida ownership antes de usar dados de `AsyncStorage`

**Onde testar:**
- Backend Integration: `churchController.getAll()` retorna apenas igreja do usuário
- Mobile Integration: `ChurchScreen` valida ownership antes de prefill
- E2E: Usuário A não vê dados de Usuário B

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre tenants

---

#### INV-2: Prevenção de Duplicação de Igreja
**Descrição:** Um usuário nunca pode ter mais de uma igreja "pending" criada por ele.

**Enforcement:**
- Backend: `POST /churches` verifica `createdByUserId` antes de criar
- Se igreja existe, retorna existente (200 OK) ao invés de criar nova (201 Created)

**Onde testar:**
- Backend Integration: `churchController.create()` retorna igreja existente quando `createdByUserId` já existe
- E2E: Tentar criar segunda igreja retorna primeira

**Violação:** 🟡 **ALTO** - Dados inconsistentes, possível violação de limites de plano

---

#### INV-3: Validação de Ownership
**Descrição:** Dados de prefill devem sempre validar ownership antes de uso.

**Enforcement:**
- Frontend: `ChurchScreen` valida via `GET /churches` antes de usar `AsyncStorage`
- Se igreja não pertence ao usuário, limpa `AsyncStorage`

**Onde testar:**
- Mobile Integration: `ChurchScreen` limpa `AsyncStorage` se igreja não pertence ao usuário
- E2E: Dados de outro usuário não aparecem após logout/login

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre tenants

---

### Invariantes de Estado

#### INV-4: Onboarding Obrigatório
**Descrição:** Usuário não pode acessar Main App sem `onboardingCompleted = true` no token.

**Enforcement:**
- `AppNavigator` verifica `onboardingCompleted` além de `hasCompleteMember`
- `OnboardingProgress.completed` só é `true` quando usuário finaliza explicitamente

**Onde testar:**
- Mobile Integration: `AppNavigator` bloqueia acesso sem `onboardingCompleted`
- E2E: Tentar acessar Main sem completar onboarding redireciona para onboarding

**Violação:** 🔴 **CRÍTICO** - Usuário acessa app sem configurar igreja

---

#### INV-5: Member Completo para Acesso
**Descrição:** Usuário sem `memberId`, `branchId` ou `role` não pode acessar Main App.

**Enforcement:**
- `AppNavigator` verifica `hasCompleteMember = user?.memberId && user?.branchId && user?.role`
- Guard global previne acesso sem Member completo

**Onde testar:**
- Mobile Integration: `AppNavigator` bloqueia acesso sem Member completo
- E2E: Tentar acessar Main sem Member redireciona para onboarding

**Violação:** 🔴 **CRÍTICO** - Erros 404 em funcionalidades que requerem Member

---

#### INV-6: Token Atualizado Após Mudanças de Contexto
**Descrição:** Token deve ser atualizado sempre que Member/Branch/Onboarding muda.

**Enforcement:**
- Backend sempre retorna token atualizado após criar/atualizar igreja
- Backend sempre retorna token atualizado após completar onboarding
- Frontend sempre atualiza store quando recebe token do backend

**Onde testar:**
- Backend Integration: `POST /churches` retorna token com `memberId`, `branchId`, `role`
- Backend Integration: `POST /onboarding/complete` retorna token com `onboardingCompleted = true`
- Mobile Integration: `ChurchScreen` atualiza token após criar igreja
- E2E: Token contém dados corretos após cada etapa

**Violação:** 🟡 **ALTO** - Estado inconsistente, navegação quebrada

---

### Invariantes de Dados

#### INV-7: Limpeza de AsyncStorage no Logout
**Descrição:** Todos os dados de onboarding devem ser limpos do `AsyncStorage` no logout.

**Enforcement:**
- `authStore.logout()` limpa todas as chaves de onboarding:
  - `onboarding_church_id`
  - `onboarding_church_name`
  - `onboarding_church_address`
  - `onboarding_structure`
  - `onboarding_modules`
  - `onboarding_roles_created`
- Previne vazamento de dados entre usuários

**Onde testar:**
- Mobile Unit: `authStore.logout()` limpa todas as chaves
- E2E: Dados não aparecem após logout/login com outro usuário

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre usuários

---

#### INV-8: Branch Sempre Criada com Igreja
**Descrição:** Toda igreja criada deve ter pelo menos uma Branch (principal).

**Enforcement:**
- `churchService.createChurchWithMainBranch()` sempre cria Branch principal
- Member requer Branch (FK obrigatória)

**Onde testar:**
- Backend Unit: `createChurchWithMainBranch()` sempre cria Branch
- Backend Integration: `POST /churches` retorna Branch criada

**Violação:** 🟡 **ALTO** - Inconsistência de dados, Member não pode ser criado

---

#### INV-9: Member Sempre Criado com Igreja
**Descrição:** Toda igreja criada deve ter Member associado ao criador.

**Enforcement:**
- `churchService.createChurchWithMainBranch()` sempre cria Member (ADMINGERAL)
- Se Member não existe ao retornar igreja existente, cria automaticamente

**Onde testar:**
- Backend Unit: `createChurchWithMainBranch()` sempre cria Member
- Backend Integration: `POST /churches` retorna Member criado
- Backend Integration: Retornar igreja existente cria Member se não existe

**Violação:** 🟡 **ALTO** - Usuário não pode usar app sem Member

---

#### INV-10: OnboardingProgress Criado Automaticamente
**Descrição:** `OnboardingProgress` é criado automaticamente quando necessário.

**Enforcement:**
- `OnboardingProgressService.getOrCreateProgress()` cria se não existe
- Endpoints de onboarding sempre criam progresso se necessário

**Onde testar:**
- Backend Unit: `getOrCreateProgress()` cria se não existe
- Backend Integration: Endpoints criam progresso automaticamente

**Violação:** 🟢 **BAIXO** - Apenas UX (progresso não rastreado)

---

### Invariantes de Navegação

#### INV-11: Transição Automática Após Mudança de Estado
**Descrição:** `AppNavigator` deve transicionar automaticamente quando estado muda, sem navegação manual.

**Enforcement:**
- Nenhuma tela faz `navigation.reset()` ou `navigation.navigate('Main')` manualmente
- `AppNavigator` re-renderiza quando `authStore.user` muda
- Transições são automáticas baseadas em estado

**Onde testar:**
- Mobile Integration: Nenhuma tela faz navegação manual para Main
- E2E: Transições são automáticas após atualizar token

**Violação:** 🟡 **ALTO** - Erros de navegação, UX ruim

---

#### INV-12: Login Sempre Mostra Tela Correta
**Descrição:** Após login, usuário deve ver Login, Onboarding ou Main baseado em estado.

**Enforcement:**
- `AppNavigator` verifica `isAuthenticated()`, `hasCompleteMember`, `onboardingCompleted`
- Renderiza navigator correto baseado em estado

**Onde testar:**
- Mobile Integration: Login mostra tela correta baseado em estado
- E2E: Fluxo completo de login funciona corretamente

**Violação:** 🔴 **CRÍTICO** - Usuário preso ou vê tela errada

---

### Mapeamento: Invariante → Onde Testar

| Invariante | Unit | Integration | E2E | Prioridade |
|------------|------|-------------|-----|------------|
| INV-1: Isolamento Multi-Tenancy | ❌ | ✅ Backend + Mobile | ✅ | 🔴 Crítico |
| INV-2: Prevenção Duplicação | ❌ | ✅ Backend | ✅ | 🟡 Alto |
| INV-3: Validação Ownership | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-4: Onboarding Obrigatório | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-5: Member Completo | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-6: Token Atualizado | ❌ | ✅ Backend + Mobile | ✅ | 🟡 Alto |
| INV-7: Limpeza AsyncStorage | ✅ Mobile | ❌ | ✅ | 🔴 Crítico |
| INV-8: Branch Sempre Criada | ✅ Backend | ✅ Backend | ❌ | 🟡 Alto |
| INV-9: Member Sempre Criado | ✅ Backend | ✅ Backend | ❌ | 🟡 Alto |
| INV-10: OnboardingProgress Criado | ✅ Backend | ✅ Backend | ❌ | 🟢 Baixo |
| INV-11: Transição Automática | ❌ | ✅ Mobile | ✅ | 🟡 Alto |
| INV-12: Login Mostra Tela Correta | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |

**Legenda:**
- ✅ Deve ser testado
- ❌ Não necessário ou não aplicável
- 🔴 Crítico: Deve ser testado antes de deploy
- 🟡 Alto: Deve ser testado em breve
- 🟢 Baixo: Pode ser testado depois

---

## 🔄 Fluxo de Navegação (Mobile)

### AppNavigator - Lógica de Decisão

```typescript
// 1. Verifica autenticação
if (!isAuthenticated()) {
  return <LoginNavigator />
}

// 2. Verifica Member completo
const hasCompleteMember = user?.memberId && user?.branchId && user?.role

// 3. Verifica onboarding completo
const onboardingCompleted = user?.onboardingCompleted === true

// 4. Decisão final
if (!hasCompleteMember || !onboardingCompleted) {
  return <OnboardingNavigator />
}

return <MainNavigator />
```

### Transições Automáticas

- **Login bem-sucedido** → `AppNavigator` re-renderiza → Mostra onboarding ou main
- **Token atualizado** → `authStore` atualiza → `AppNavigator` re-renderiza → Transição automática
- **Onboarding completo** → Token atualizado → `AppNavigator` detecta → Redireciona para main

**Não há navegação manual** (`navigation.reset`, `navigation.navigate`) após mudanças de estado. Tudo é gerenciado pelo `AppNavigator`.

---

## 📝 Notas de Implementação

### Decisões de Design

1. **OnboardingProgress separado de Member**
   - Razão: Permite rastrear progresso mesmo sem Member completo
   - Benefício: Onboarding pode ser resumido mesmo se Member foi criado

2. **Token sempre inclui `onboardingCompleted`**
   - Razão: Evita consulta extra ao banco em cada request
   - Benefício: Performance e simplicidade

3. **Branch sempre criada automaticamente**
   - Razão: Member requer Branch (FK obrigatória)
   - Benefício: Garante consistência de dados

4. **Idempotência via `createdByUserId`**
   - Razão: Previne múltiplas igrejas "pending"
   - Benefício: UX melhor e dados consistentes

5. **Validação de ownership no frontend**
   - Razão: Prevenir vazamento de dados entre tenants
   - Benefício: Segurança adicional (defense in depth)

---

## 🐛 Problemas Conhecidos e Limitações

### Limitações Atuais

1. **Estrutura "simple" não marca `branchesConfigured` automaticamente**
   - Status: Identificado, não corrigido
   - Impacto: Baixo (não impede conclusão do onboarding)
   - Solução futura: Marcar automaticamente após criar igreja se estrutura = "simple"

2. **Token expira em 7 dias sem renovação**
   - Status: Por design
   - Impacto: Médio (usuário precisa fazer login novamente)
   - Solução futura: Implementar refresh token

3. **Onboarding não pode ser "pulado"**
   - Status: Por design (obrigatório)
   - Impacto: Nenhum (comportamento esperado)

---

## 📚 Referências de Código

### Backend
- `backend/src/controllers/churchController.ts` - Criação/atualização de igreja
- `backend/src/controllers/onboardingController.ts` - Estado e progresso de onboarding
- `backend/src/services/onboardingProgressService.ts` - Lógica de progresso
- `backend/src/services/churchService.ts` - Criação de igreja com Branch/Member
- `backend/src/services/auth/loginService.ts` - Login com onboardingCompleted

### Mobile
- `mobile/src/navigation/AppNavigator.tsx` - Guard de navegação
- `mobile/src/screens/onboarding/StartScreen.tsx` - Início do onboarding
- `mobile/src/screens/onboarding/ChurchScreen.tsx` - Configuração de igreja
- `mobile/src/screens/onboarding/BranchesScreen.tsx` - Configuração de filiais
- `mobile/src/screens/onboarding/SettingsScreen.tsx` - Configuração de settings
- `mobile/src/screens/onboarding/ConcluidoScreen.tsx` - Finalização
- `mobile/src/stores/authStore.ts` - Estado de autenticação

---

## ❓ Open Questions / Assumptions

### Questões em Aberto

1. **Estrutura "simple" não marca `branchesConfigured` automaticamente**
   - **Status:** Identificado, não corrigido
   - **Impacto:** Baixo (não impede conclusão do onboarding)
   - **Solução futura:** Marcar automaticamente após criar igreja se estrutura = "simple"

2. **Refresh Token**
   - **Status:** Não implementado
   - **Impacto:** Médio (usuário precisa fazer login após 7 dias)
   - **Decisão:** Deferido para fase posterior (MVP não requer)

3. **Health Check para Planos**
   - **Status:** Não implementado
   - **Impacto:** Baixo (planos existem via seed)
   - **Decisão:** Opcional, pode ser adicionado depois

### Assumptions Documentadas

1. **Planos sempre existem em produção**
   - Assumimos que planos são criados via seed/migration antes de deploy
   - Não há auto-criação de planos em runtime em produção

2. **Token expira em 7 dias**
   - Por design atual
   - Usuário precisa fazer login novamente após expiração

3. **Onboarding não pode ser pulado**
   - Por design (obrigatório)
   - Usuário deve completar todas as etapas antes de acessar app

4. **Estrutura "existing" não implementada**
   - Funcionalidade de entrar em igreja existente está planejada mas não implementada
   - Atualmente apenas mostra mensagem informativa

---

**Fim do Relatório**

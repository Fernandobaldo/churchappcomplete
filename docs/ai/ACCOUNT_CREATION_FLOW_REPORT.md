# Relatório "As-Is": Fluxo de Criação de Conta → Primeiro Acesso → Uso do App

**Data:** 2025-01-09  
**Projeto:** ChurchApp (White-label)  
**Stack:** Backend (Fastify + Prisma) + Mobile (Expo/React Native) + Web (React/Vite)

---

## 📋 Sumário Executivo

### O que funciona:
- ✅ Registro público via landing page cria User + Subscription (plano Free)
- ✅ Login autentica User e retorna JWT com dados de Member (se existir)
- ✅ Registro via link de convite cria User + Member vinculado à Branch
- ✅ Onboarding permite criar Church + Branch + Member (ADMINGERAL)
- ✅ JWT armazenado em AsyncStorage (persistente)
- ✅ Validação de limites de plano (maxMembers, maxBranches)
- ✅ Interceptor axios adiciona token automaticamente

### Principais riscos identificados:
- 🔴 **ALTO**: Usuário pode criar conta mas não ter Member (sem branchId/role no token) → fica preso
- 🔴 **ALTO**: Onboarding não é obrigatório → usuário pode pular e ficar sem Member
- 🟡 **MÉDIO**: Token não é atualizado após criar igreja → precisa fazer logout/login
- 🟡 **MÉDIO**: Validação de limite de plano pode falhar silenciosamente
- 🟡 **MÉDIO**: Não há refresh token → token expira em 7 dias sem renovação
- 🟢 **BAIXO**: Campos inválidos enviados no onboarding podem causar erro 400

---

## 🌐 Aplicação Web (React/Vite)

### Estrutura
- **Framework:** React + Vite
- **Roteamento:** React Router (implícito via App.tsx)
- **Estado:** Zustand (authStore)
- **Armazenamento:** localStorage (via Zustand persist)

### Telas Principais
- **Login:** `web/src/pages/Login.tsx`
- **Register:** `web/src/pages/Register.tsx`
- **RegisterInvite:** `web/src/pages/RegisterInvite.tsx`
- **Onboarding:** `web/src/pages/onboarding/*` (Start, Church, Branches, Settings, etc.)
- **Dashboard:** `web/src/pages/Dashboard.tsx`

### Guards de Rota
- **ProtectedRoute:** `web/src/components/ProtectedRoute.tsx`
  - Verifica se usuário está autenticado
  - Redireciona para Login se não autenticado
- **PermissionProtectedRoute:** `web/src/components/PermissionProtectedRoute.tsx`
  - Verifica permissões específicas
  - Redireciona para Forbidden se sem permissão

### Armazenamento de Token
- **Store:** `web/src/stores/authStore.ts`
- **Persistência:** localStorage (via Zustand persist)
- **Key:** `'auth-storage'` (mesmo que mobile)

### Diferenças do Mobile
- ✅ Mesmos endpoints de API
- ✅ Mesmo formato de token JWT
- ✅ Mesma estrutura de authStore
- ⚠️ Armazenamento: localStorage (web) vs AsyncStorage (mobile)
- ⚠️ Navegação: React Router (web) vs React Navigation (mobile)

---

## 🔄 Diagrama de Fluxo de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  A) Registro Padrão (Landing/App)                               │
│  B) Login (Usuário Existente)                                   │
│  C) Registro via Link de Convite                                │
│  D) Onboarding (Primeira Configuração)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  • JWT Token (7 dias de expiração)                              │
│  • Armazenado: AsyncStorage (mobile)                             │
│  • Interceptor axios adiciona automaticamente                   │
│  • Validação: middleware authenticate.ts                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA MODEL                                    │
├─────────────────────────────────────────────────────────────────┤
│  User → Subscription → Plan                                      │
│  User → Member → Branch → Church                                │
│  Member → Permission[]                                          │
│  MemberInviteLink → Branch                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION GUARDS                             │
├─────────────────────────────────────────────────────────────────┤
│  • LoginScreen: verifica token → redireciona se autenticado     │
│  • DashboardScreen: verifica memberId antes de buscar avatar    │
│  • Onboarding: verifica branchId/role → redireciona se completo │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 FLUXO A: Registro Padrão (Landing/App)

### 1. Trigger
- **Tela:** `mobile/src/screens/RegisterScreen.tsx`
- **Ação:** Usuário preenche formulário (name, email, password, churchName) e clica em "Criar conta"

### 2. Endpoint Backend
- **Rota:** `POST /register` (público)
- **Arquivo:** `backend/src/routes/auth/register.ts` (linha 8)
- **Controller:** `backend/src/controllers/auth/registerController.ts` (linha 8)
- **Service:** `backend/src/services/auth/registerService.ts` (linha 32)

### 3. Payload Enviado
```typescript
{
  name: string,
  email: string,
  password: string,
  fromLandingPage: true  // Indica registro público
}
```

### 4. Processamento Backend

#### 4.1. Validação (registerController.ts:9-28)
- Schema Zod valida: name (min 1), email (email válido), password (min 6)
- `fromLandingPage: true` → não requer autenticação

#### 4.2. Criação de User (registerService.ts:32-335)
- **Arquivo:** `backend/src/services/auth/registerService.ts`
- **Linhas:** 165-185 (registro público)
- **Ações:**
  1. Verifica se email já existe (User ou Member)
  2. Hash da senha (bcrypt, 10 rounds)
  3. Separa `name` em `firstName` e `lastName`
  4. Cria `User` no banco:
     ```prisma
     User {
       firstName, lastName, email, password
     }
     ```
  5. Busca plano "Free" (tenta variações: 'free', 'Free', 'Free Plan')
  6. Cria `Subscription`:
     ```prisma
     Subscription {
       userId, planId, status: 'active'
     }
     ```
  7. Gera token JWT (sem memberId, sem branchId, sem role):
     ```typescript
     {
       sub: user.id,
       email: user.email,
       name: `${firstName} ${lastName}`,
       type: 'user',
       // memberId: null
       // branchId: null
       // role: null
     }
     ```

### 5. Resposta Backend
```typescript
{
  user: { id, firstName, lastName, email },
  token: string  // JWT válido por 7 dias
}
```

### 6. Processamento Mobile (RegisterScreen.tsx:64-120)

#### 6.1. Recebe Token
- **Linha 76:** Extrai `token` de `response.data`
- **Linha 83:** Chama `setToken(token)` → salva no axios
- **Linha 86:** Chama `setUserFromToken(token)` → salva no AsyncStorage via Zustand

#### 6.2. Criação de Igreja (RegisterScreen.tsx:89-94)
- **Endpoint:** `POST /churches` (requer autenticação)
- **Payload:**
  ```typescript
  {
    name: churchName,
    withBranch: true,
    branchName: 'Sede'
  }
  ```
- **Problema:** Se falhar, continua mesmo assim (linha 99-120)

### 7. Navegação Mobile
- **Se igreja criada com sucesso:**
  - **Linha 101:** Navega para `StartOnboarding`
- **Se falhar criação de igreja:**
  - **Linha 120:** Navega para `StartOnboarding` mesmo assim
  - **Problema:** Usuário pode ficar sem Member

### 8. Estado Final Esperado
- ✅ `User` criado
- ✅ `Subscription` criada (plano Free)
- ✅ `Church` criada (se sucesso)
- ✅ `Branch` criada (se sucesso, nome: "Sede")
- ✅ `Member` criado (se sucesso, role: ADMINGERAL)
- ✅ `Permission[]` criadas (todas as permissões para ADMINGERAL)
- ⚠️ **Token pode não ter memberId/branchId se criação de igreja falhar**

### 9. Arquivos Envolvidos
- **Mobile:** `mobile/src/screens/RegisterScreen.tsx`
- **Backend Route:** `backend/src/routes/auth/register.ts`
- **Backend Controller:** `backend/src/controllers/auth/registerController.ts`
- **Backend Service:** `backend/src/services/auth/registerService.ts` (linhas 165-185)
- **Auth Store:** `mobile/src/stores/authStore.ts` (linha 51-79)

---

## 📍 FLUXO B: Login (Usuário Existente)

### 1. Trigger
- **Tela:** `mobile/src/screens/LoginScreen.tsx`
- **Ação:** Usuário preenche email/password e clica em "Entrar"

### 2. Endpoint Backend
- **Rota:** `POST /auth/login` (público)
- **Arquivo:** `backend/src/routes/auth/login.ts` (linha 15)
- **Service:** `backend/src/services/authService.ts` (linha 111)

### 3. Payload Enviado
```typescript
{
  email: string,
  password: string
}
```

### 4. Processamento Backend

#### 4.1. Validação de Credenciais (authService.ts:21-109)
- **Arquivo:** `backend/src/services/authService.ts`
- **Método:** `validateCredentials(email, password)`
- **Ações:**
  1. Busca `User` por email (inclui Member, Permission, Branch, Church)
  2. Se Member não encontrado via relação, busca manualmente por `userId` ou `email`
  3. Compara senha com bcrypt
  4. Retorna:
     - `type: 'member'` se User tem Member
     - `type: 'user'` se User não tem Member

#### 4.2. Geração de Token (authService.ts:111-187)
- **Método:** `login(email, password)`
- **Token Payload:**
  ```typescript
  {
    sub: user.id,
    userId: user.id,
    email: user.email,
    name: getUserFullName(user),
    type: 'member' | 'user',
    memberId: member?.id || null,
    role: member?.role || null,
    branchId: member?.branchId || null,
    churchId: member?.Branch?.Church?.id || null,
    permissions: member?.Permission.map(p => p.type) || []
  }
  ```
- **Expiração:** 7 dias (`expiresIn: '7d'`)

### 5. Resposta Backend
```typescript
{
  token: string,
  user: {
    id, email, name,
    memberId, role, branchId, churchId,
    permissions: [{ type: string }]
  },
  type: 'user' | 'member'
}
```

### 6. Processamento Mobile (LoginScreen.tsx:63-110)

#### 6.1. Recebe Token
- **Linha 71:** Chama `authService.login(email, password)`
- **Linha 74:** Extrai `token` e `user`
- **Linha 82:** Chama `setToken(token)` → salva no axios
- **Linha 85:** Chama `setUserFromToken(token)` → salva no AsyncStorage

#### 6.2. Decisão de Navegação (LoginScreen.tsx:88-98)
- **Linha 90:** Aguarda 100ms para store atualizar
- **Linha 91:** Verifica se `userData?.branchId` ou `userData?.role` estão ausentes
- **Se sem branchId/role:**
  - **Linha 93:** Navega para `StartOnboarding`
- **Se com branchId/role:**
  - **Linha 96:** Navega para `Main` (TabNavigator)

### 7. Guard de Navegação (LoginScreen.tsx:32-54)
- **useEffect:** Se `token && user` existem, redireciona para `Main` imediatamente
- **beforeRemove listener:** Previne voltar para Login se autenticado

### 8. Estado Final
- ✅ Token salvo no AsyncStorage
- ✅ Token salvo no axios (headers)
- ✅ User data decodificado do token e salvo no store
- ✅ Navegação baseada em presença de `branchId`/`role`

### 9. Arquivos Envolvidos
- **Mobile:** `mobile/src/screens/LoginScreen.tsx`
- **Backend Route:** `backend/src/routes/auth/login.ts`
- **Backend Service:** `backend/src/services/authService.ts`
- **Auth Store:** `mobile/src/stores/authStore.ts`

---

## 📍 FLUXO C: Registro via Link de Convite

### 1. Trigger
- **Tela:** `mobile/src/screens/RegisterInviteScreen.tsx`
- **Ação:** Usuário acessa URL com token (ex: `/register/invite/:token`)

### 2. Validação Inicial (RegisterInviteScreen.tsx:61-105)
- **Endpoint:** `GET /invite-links/:token/info` (público)
- **Arquivo:** `backend/src/routes/inviteLinkRoutes.ts` (linha 228)
- **Controller:** `backend/src/controllers/inviteLinkController.ts` (linha 334)
- **Validações:**
  - Link existe?
  - `isActive === true`?
  - `expiresAt` não passou? (validação client-side, linha 81)
  - `currentUses < maxUses` (se maxUses não for null)?

### 3. Endpoint de Registro
- **Rota:** `POST /public/register/invite` (público)
- **Arquivo:** `backend/src/routes/public/register.ts` (linha 89)
- **Controller:** `backend/src/controllers/auth/registerController.ts` (linha 8)

### 4. Payload Enviado (RegisterInviteScreen.tsx:128-131)
```typescript
{
  name: string,
  email: string,
  password: string,
  phone?: string,
  address?: string,
  birthDate?: string,  // formato dd/MM/yyyy
  avatarUrl?: string,
  inviteToken: string
}
```

### 5. Processamento Backend

#### 5.1. Validação de Email (registerService.ts:52-63)
- **Arquivo:** `backend/src/services/auth/registerService.ts`
- **Linhas:** 55-63
- Verifica se email já existe em `User` ou `Member`
- **Erro:** 400 "Email já cadastrado como usuário/membro"

#### 5.2. Validação de Link (registerService.ts:66-73)
- **Método:** `validateInviteLink(inviteToken)`
- **Arquivo:** `backend/src/services/inviteLinkService.ts` (linha 146)
- **Validações:**
  1. Link existe?
  2. `isActive === true`?
  3. `expiresAt` não passou? (usa `normalizeExpirationDate` para fim do dia)
  4. `currentUses < maxUses` (se não for null)?
  5. Limite de membros do plano não atingido?
- **Erros possíveis:**
  - 404: "Link de convite não encontrado"
  - 403: "Este link de convite foi desativado"
  - 403: "Este link de convite expirou"
  - 403: "Este link de convite atingiu o limite de usos"
  - 403: "LIMIT_REACHED" (limite de membros do plano)

#### 5.3. Criação de User (registerService.ts:77-90)
- Separa `name` em `firstName` e `lastName`
- Hash da senha
- Cria `User`:
  ```prisma
  User {
    firstName, lastName, email, password
  }
  ```

#### 5.4. Parse de Data de Nascimento (registerService.ts:92-104)
- Tenta parse ISO primeiro
- Se falhar, tenta formato `dd/MM/yyyy` com `date-fns`

#### 5.5. Criação de Member (registerService.ts:107-120)
- **Cria Member vinculado ao link:**
  ```prisma
  Member {
    name, email,
    role: 'MEMBER',  // Sempre MEMBER para registro via link
    branchId: inviteLink.branchId,
    userId: newUser.id,
    inviteLinkId: inviteLink.id,
    birthDate, phone, address, avatarUrl
  }
  ```

#### 5.6. Criação de Permissão (registerService.ts:123-128)
- Cria permissão `members_view` automaticamente

#### 5.7. Incremento de Uso (registerService.ts:131)
- Incrementa `currentUses` do link

#### 5.8. Email de Boas-vindas (registerService.ts:134-139)
- Envia email (não quebra se falhar)

#### 5.9. Notificação de Admins (registerService.ts:142-163)
- Notifica admins sobre novo registro (não quebra se falhar)

### 6. Geração de Token (registerController.ts:66-94)
- **Arquivo:** `backend/src/controllers/auth/registerController.ts`
- Busca User com Member completo
- Gera token JWT:
  ```typescript
  {
    sub: user.id,
    email: user.email,
    name: getUserFullName(user),
    type: 'member',
    memberId: member.id,
    role: 'MEMBER',
    branchId: member.branchId,
    permissions: ['members_view']
  }
  ```

### 7. Resposta Backend
```typescript
{
  member: {
    id, name, email, role, branchId, userId,
    inviteLinkId, phone, address, birthDate, avatarUrl,
    createdAt, updatedAt
  },
  token: string  // JWT com memberId, branchId, role
}
```

### 8. Processamento Mobile (RegisterInviteScreen.tsx:107-164)

#### 8.1. Recebe Token
- **Linha 133:** Extrai `token` e `member`
- **Linha 139:** Chama `setUserFromToken(token)` → salva no AsyncStorage

#### 8.2. Tratamento de Erros
- **Linha 150:** Se `error === 'LIMIT_REACHED'`:
  - Navega para `MemberLimitReachedScreen` com token do link
- **Outros erros:** Mostra Toast e permanece na tela

#### 8.3. Navegação
- **Linha 146:** Se sucesso, navega para `Main` (TabNavigator)

### 9. Estado Final
- ✅ `User` criado
- ✅ `Member` criado (role: MEMBER)
- ✅ `Member` vinculado à `Branch` do link
- ✅ `Member.inviteLinkId` preenchido
- ✅ `Permission` criada (`members_view`)
- ✅ `MemberInviteLink.currentUses` incrementado
- ✅ Token JWT com todos os dados do Member

### 10. Arquivos Envolvidos
- **Mobile:** `mobile/src/screens/RegisterInviteScreen.tsx`
- **Backend Route:** `backend/src/routes/public/register.ts` (linha 89)
- **Backend Controller:** `backend/src/controllers/auth/registerController.ts` (linha 8)
- **Backend Service:** `backend/src/services/auth/registerService.ts` (linhas 52-163)
- **Invite Link Service:** `backend/src/services/inviteLinkService.ts` (linha 146)

---

## 📍 FLUXO D: Onboarding (Primeira Configuração)

### 1. Trigger
- **Tela:** `mobile/src/screens/onboarding/StartScreen.tsx`
- **Condição:** Usuário logado mas sem `branchId` ou `role` no token
- **Ação:** Usuário seleciona estrutura (simple/branches/existing)

### 2. Tela: StartScreen (StartScreen.tsx)
- **Arquivo:** `mobile/src/screens/onboarding/StartScreen.tsx`
- **Opções:**
  - `simple`: Estrutura simples (uma igreja sem filiais)
  - `branches`: Com filiais (igreja principal + múltiplas filiais)
  - `existing`: Entrar em igreja existente (não implementado)
- **Ação:** Salva escolha em `AsyncStorage` ('onboarding_structure')
- **Navegação:** `ChurchOnboarding`

### 3. Tela: ChurchOnboarding (ChurchScreen.tsx)
- **Arquivo:** `mobile/src/screens/onboarding/ChurchScreen.tsx`
- **Endpoint:** `POST /churches` (requer autenticação)
- **Arquivo Backend:** `backend/src/controllers/churchController.ts` (linha 12)
- **Service:** `backend/src/services/churchService.ts` (linha 30)

#### 3.1. Payload Enviado (ChurchScreen.tsx:80-84)
```typescript
{
  name: string,  // Nome da igreja
  address?: string,
  withBranch: boolean,  // true se structureType === 'branches'
  branchName: 'Sede'
}
```

#### 3.2. Processamento Backend (churchController.ts:12-129)

**Validação:**
- Schema Zod (linha 14-31): name obrigatório, campos opcionais
- Verifica autenticação (linha 36-39)
- Busca User no banco (linha 43)

**Criação (churchService.ts:30-110):**
1. Cria `Church`:
   ```prisma
   Church {
     name, address, phone, email, website, socialMedia,
     logoUrl, avatarUrl, isActive: true
   }
   ```

2. Se `withBranch !== false`:
   - Cria `Branch`:
     ```prisma
     Branch {
       name: branchName || 'Sede',
       churchId: church.id,
       isMainBranch: true
     }
     ```
   - Verifica se Member já existe (por userId ou email)
   - Se existe: atualiza Member (role: ADMINGERAL, branchId)
   - Se não existe: cria Member:
     ```prisma
     Member {
       name: getUserFullName(user),
       email: user.email,
       role: 'ADMINGERAL',
       branchId: branch.id,
       userId: user.id
     }
     ```
   - Cria todas as permissões (`ALL_PERMISSION_TYPES`) para o Member

#### 3.3. Geração de Novo Token (churchController.ts:56-92)
- Busca User com Member completo
- Gera novo token JWT com:
  ```typescript
  {
    sub: user.id,
    email: user.email,
    name: getUserFullName(user),
    type: 'member',
    memberId: member.id,
    role: 'ADMINGERAL',
    branchId: member.branchId,
    churchId: church.id,
    permissions: member.Permission.map(p => p.type)
  }
  ```

#### 3.4. Resposta Backend
```typescript
{
  church: { id, name, logoUrl, avatarUrl, isActive },
  branch: { id, name, churchId, isMainBranch },
  member: { id, name, email, role, branchId },
  token: string  // Novo token com memberId/branchId/role
}
```

#### 3.5. Processamento Mobile (ChurchScreen.tsx:66-113)
- **Linha 80:** Envia POST `/churches`
- **Linha 81:** Se `response.data.token` existe, atualiza token:
  - **Linha 82:** `setUserFromToken(response.data.token)`
- **Linha 85:** Salva `churchId` no estado
- **Linha 96-102:** Navegação baseada em `structureType`:
  - Se `branches`: `BranchesOnboarding`
  - Se `simple`: `SettingsOnboarding`

### 4. Tela: BranchesOnboarding (BranchesScreen.tsx) - Opcional
- **Arquivo:** `mobile/src/screens/onboarding/BranchesScreen.tsx`
- **Condição:** Apenas se `structureType === 'branches'`
- **Ações:**
  - Lista filiais existentes (GET `/churches`)
  - Permite adicionar/remover/editar filiais
  - Cria filiais: POST `/branches` (requer autenticação)
  - Atualiza filiais: PUT `/branches/:id` (requer autenticação)
- **Navegação:** `SettingsOnboarding`

### 5. Tela: SettingsOnboarding (SettingsScreen.tsx)
- **Arquivo:** `mobile/src/screens/onboarding/SettingsScreen.tsx`
- **Passos:**
  1. **Step 1 (Roles):** Apenas UI, não cria roles (TODO)
  2. **Step 2 (Módulos):** Salva em AsyncStorage ('onboarding_modules')
  3. **Step 3 (Convites):** Apenas UI, não envia convites (TODO)
- **Navegação Final:** `Main` (TabNavigator)

### 6. Tela: ConcluidoScreen (ConcluidoScreen.tsx) - Não usado
- **Arquivo:** `mobile/src/screens/onboarding/ConcluidoScreen.tsx`
- **Status:** Tela existe mas não é usada no fluxo atual

### 7. Estado Final Esperado
- ✅ `Church` criada
- ✅ `Branch` criada (pelo menos "Sede")
- ✅ `Member` criado/atualizado (role: ADMINGERAL)
- ✅ `Permission[]` criadas (todas para ADMINGERAL)
- ✅ Token atualizado com memberId/branchId/role/churchId
- ⚠️ **Problema:** Se usuário pular onboarding, pode ficar sem Member

### 8. Arquivos Envolvidos
- **Mobile:** 
  - `mobile/src/screens/onboarding/StartScreen.tsx`
  - `mobile/src/screens/onboarding/ChurchScreen.tsx`
  - `mobile/src/screens/onboarding/BranchesScreen.tsx`
  - `mobile/src/screens/onboarding/SettingsScreen.tsx`
- **Backend:**
  - `backend/src/controllers/churchController.ts` (linha 12)
  - `backend/src/services/churchService.ts` (linha 30)
  - `backend/src/routes/churchRoutes.ts` (linha 9)
  - `backend/src/routes/branchRoutes.ts` (linha 10)

---

## 🗄️ Interações com Banco de Dados

### Tabelas/Models Envolvidos

#### 1. User
- **Criado em:** Registro padrão, Registro via invite
- **Campos usados:**
  - `id` (cuid)
  - `firstName`, `lastName` (separados de `name`)
  - `email` (único)
  - `password` (hash bcrypt)
  - `phone`, `document` (opcional, apenas registro público)

#### 2. Subscription
- **Criado em:** Registro padrão (plano Free)
- **Campos usados:**
  - `userId`
  - `planId` (plano "Free")
  - `status: 'active'`

#### 3. Plan
- **Lido em:** Validação de limites
- **Campos usados:**
  - `maxMembers` (null = ilimitado)
  - `maxBranches` (null = ilimitado)
  - `name` (busca por 'free', 'Free', 'Free Plan')

#### 4. Church
- **Criado em:** Onboarding (ChurchScreen), Registro padrão (tentativa)
- **Campos usados:**
  - `id`, `name`, `address`, `phone`, `email`, `website`
  - `logoUrl`, `avatarUrl`, `socialMedia` (JSON)
  - `isActive: true`

#### 5. Branch
- **Criado em:** Onboarding (quando `withBranch !== false`)
- **Campos usados:**
  - `id`, `name`, `churchId`
  - `isMainBranch: true`

#### 6. Member
- **Criado em:** 
  - Onboarding (role: ADMINGERAL)
  - Registro via invite (role: MEMBER)
- **Campos usados:**
  - `id`, `name`, `email` (único)
  - `role` (MEMBER, COORDINATOR, ADMINFILIAL, ADMINGERAL)
  - `branchId` (obrigatório)
  - `userId` (opcional, mas usado para vincular)
  - `inviteLinkId` (apenas registro via invite)
  - `birthDate`, `phone`, `address`, `avatarUrl` (opcionais)
  - `positionId` (opcional)

#### 7. Permission
- **Criado em:** 
  - Onboarding (todas as permissões para ADMINGERAL)
  - Registro via invite (apenas `members_view`)
- **Campos usados:**
  - `memberId` (obrigatório)
  - `type` (string, valores de `ALL_PERMISSION_TYPES`)

#### 8. MemberInviteLink
- **Lido em:** Validação de link de convite
- **Atualizado em:** Incremento de uso após registro
- **Campos usados:**
  - `id`, `token` (único)
  - `branchId`, `createdBy`
  - `maxUses`, `currentUses`
  - `expiresAt` (DateTime, pode ser null)
  - `isActive: true`

### Sequência de Criação por Fluxo

#### Fluxo A (Registro Padrão):
```
1. User.create()
2. Plan.findFirst({ name: 'free' })
3. Subscription.create({ userId, planId, status: 'active' })
4. [Opcional] Church.create()
5. [Opcional] Branch.create()
6. [Opcional] Member.create() + Permission.createMany()
```

#### Fluxo B (Login):
```
Apenas leitura:
- User.findUnique({ email })
- Member.findFirst({ userId }) ou Member.findUnique({ email })
- Permission.findMany({ memberId })
```

#### Fluxo C (Registro via Invite):
```
1. MemberInviteLink.findUnique({ token })
2. validateInviteLink() → verifica limites
3. User.create()
4. Member.create({ inviteLinkId, role: 'MEMBER' })
5. Permission.create({ type: 'members_view' })
6. MemberInviteLink.update({ currentUses: +1 })
```

#### Fluxo D (Onboarding):
```
1. Church.create()
2. Branch.create({ isMainBranch: true })
3. Member.findFirst({ userId }) ou Member.create()
4. Permission.createMany({ ALL_PERMISSION_TYPES })
```

---

## 🔌 Mapa de Endpoints da API

### Autenticação (Públicos)

| Método | Endpoint | Auth | Controller | Service | Payload Request | Payload Response |
|--------|----------|------|------------|---------|-----------------|------------------|
| POST | `/register` | ❌ | `registerController.ts:8` | `registerService.ts:32` | `{ name, email, password, fromLandingPage: true }` | `{ user: { id, firstName, lastName, email }, token }` |
| POST | `/public/register/invite` | ❌ | `registerController.ts:8` | `registerService.ts:32` | `{ name, email, password, inviteToken, ... }` | `{ member: {...}, token }` |
| POST | `/auth/login` | ❌ | `loginRoute.ts:103` | `authService.ts:111` | `{ email, password }` | `{ token, user: {...}, type }` |
| GET | `/auth/me` | ✅ | `memberController.ts:130` | - | - | `{ id, name, email, role, branchId, ... }` |

### Igreja (Protegidos)

| Método | Endpoint | Auth | Controller | Service | Payload Request | Payload Response |
|--------|----------|------|------------|---------|-----------------|------------------|
| POST | `/churches` | ✅ | `churchController.ts:12` | `churchService.ts:30` | `{ name, address?, withBranch?, branchName? }` | `{ church: {...}, branch: {...}, member: {...}, token? }` |
| GET | `/churches` | ✅ | `churchController.ts:131` | `churchService.ts:112` | - | `Church[]` |
| GET | `/churches/:id` | ✅ | `churchController.ts:145` | - | - | `Church` |
| PUT | `/churches/:id` | ✅ | `churchController.ts:159` | `churchService.ts:145` | `{ name, address, ... }` | `Church` |

### Filiais (Protegidos)

| Método | Endpoint | Auth | Controller | Service | Payload Request | Payload Response |
|--------|----------|------|------------|---------|-----------------|------------------|
| POST | `/branches` | ✅ | `branchController.ts:11` | `branchService.ts:11` | `{ name, city?, address?, churchId }` | `Branch` |
| GET | `/branches` | ✅ | `branchController.ts:50` | `branchService.ts:50` | - | `Branch[]` |
| PUT | `/branches/:id` | ✅ | `branchController.ts:70` | `branchService.ts:70` | `{ name, city?, address? }` | `Branch` |

### Membros (Protegidos)

| Método | Endpoint | Auth | Controller | Service | Payload Request | Payload Response |
|--------|----------|------|------------|---------|-----------------|------------------|
| GET | `/members` | ✅ | `memberController.ts:9` | `memberService.ts:23` | - | `Member[]` |
| GET | `/members/me` | ✅ | `memberController.ts:130` | `memberService.ts:242` | - | `Member` (completo) |
| GET | `/members/:id` | ✅ | `memberController.ts:46` | `memberService.ts:169` | - | `Member` |
| POST | `/register` | ✅* | `registerController.ts:8` | `registerService.ts:32` | `{ name, email, password, branchId, role?, ... }` | `{ member: {...}, token }` |

*Requer autenticação apenas se `fromLandingPage !== true`

### Links de Convite

| Método | Endpoint | Auth | Controller | Payload Request | Payload Response |
|--------|----------|------|------------|-----------------|------------------|
| GET | `/invite-links/:token/info` | ❌ | `inviteLinkController.ts:334` | - | `{ id, branchName, churchName, expiresAt, maxUses, currentUses, isActive }` |
| POST | `/invite-links` | ✅ | `inviteLinkController.ts:18` | `{ branchId, maxUses?, expiresAt? }` | `{ id, token, branchId, maxUses, currentUses, expiresAt, isActive, ... }` |
| GET | `/invite-links/branch/:branchId` | ✅ | `inviteLinkController.ts:153` | - | `MemberInviteLink[]` |
| PATCH | `/invite-links/:id/deactivate` | ✅ | `inviteLinkController.ts:190` | - | `MemberInviteLink` |

---

## 🧭 Mapa de Navegação Mobile

### Stack Navigator (AppNavigator.tsx)

**Rota Inicial:** `Login`

**Rotas de Autenticação:**
- `Login` → `LoginScreen.tsx`
- `Register` → `RegisterScreen.tsx`
- `RegisterInvite` → `RegisterInviteScreen.tsx`

**Rotas de Onboarding:**
- `StartOnboarding` → `onboarding/StartScreen.tsx`
- `ChurchOnboarding` → `onboarding/ChurchScreen.tsx`
- `BranchesOnboarding` → `onboarding/BranchesScreen.tsx`
- `SettingsOnboarding` → `onboarding/SettingsScreen.tsx`
- `ConcluidoOnboarding` → `onboarding/ConcluidoScreen.tsx` (não usado)

**Rota Principal:**
- `Main` → `TabNavigator` (tabs: Dashboard, Events, Contributions, More)

**Rotas de Erro:**
- `MemberLimitReached` → `MemberLimitReachedScreen.tsx`
- `Forbidden` → `ForbiddenScreen.tsx`

### Fluxo de Navegação por Cenário

#### Cenário 1: Novo Usuário (Registro Padrão)
```
Login → Register → StartOnboarding → ChurchOnboarding → 
  [BranchesOnboarding?] → SettingsOnboarding → Main
```

#### Cenário 2: Login (Sem Member)
```
Login → StartOnboarding → ChurchOnboarding → 
  [BranchesOnboarding?] → SettingsOnboarding → Main
```

#### Cenário 3: Login (Com Member)
```
Login → Main
```

#### Cenário 4: Registro via Invite
```
RegisterInvite → Main
```

#### Cenário 5: Registro via Invite (Limite Atingido)
```
RegisterInvite → MemberLimitReached → Login
```

### Guards de Navegação

#### LoginScreen (LoginScreen.tsx:32-54)
- **Condição:** Se `token && user` existem
- **Ação:** `navigation.reset({ routes: [{ name: 'Main' }] })`
- **Previne:** Voltar para Login quando autenticado

#### DashboardScreen (DashboardScreen.tsx:101-125)
- **Condição:** Se `user?.memberId` existe
- **Ação:** Busca avatar via `/members/me`
- **Fallback:** Se 404 ou sem memberId, não busca avatar (não é erro crítico)

---

## 🔐 Comportamento de Segurança/Sessão

### JWT Token

#### Geração
- **Biblioteca:** `jsonwebtoken` (backend), `jwt-decode` (mobile)
- **Secret:** `env.JWT_SECRET` (backend)
- **Expiração:** 7 dias (`expiresIn: '7d'`)
- **Payload:**
  ```typescript
  {
    sub: string,           // User.id
    userId?: string,       // User.id (alias)
    email: string,
    name?: string,
    type?: 'user' | 'member',
    memberId?: string | null,
    role?: string | null,
    branchId?: string | null,
    churchId?: string | null,
    permissions?: string[]
  }
  ```

#### Armazenamento
- **Mobile:** 
  - AsyncStorage (via Zustand persist)
  - Key: `'auth-storage'`
  - Arquivo: `mobile/src/stores/authStore.ts` (linha 99)
- **Axios:**
  - Headers: `Authorization: Bearer <token>`
  - Arquivo: `mobile/src/api/api.ts` (linha 59-62)

#### Validação
- **Backend:** `backend/src/middlewares/authenticate.ts` (linha 17)
- **Processo:**
  1. Extrai token de `Authorization: Bearer <token>`
  2. Verifica com `jwt.verify(token, JWT_SECRET)`
  3. Popula `request.user` com dados do payload
  4. Retorna 401 se token inválido/expirado

#### Atualização
- **Quando:** Após criar igreja (onboarding)
- **Endpoint:** `POST /churches` retorna novo `token` na resposta
- **Mobile:** `setUserFromToken(newToken)` atualiza store
- **Problema:** Não há refresh token automático

### Permissões e Roles

#### Roles (Enum)
- `MEMBER`: Membro comum
- `COORDINATOR`: Coordenador
- `ADMINFILIAL`: Administrador de filial
- `ADMINGERAL`: Administrador geral

#### Permissões
- **Fonte:** `backend/src/constants/permissions.ts` (`ALL_PERMISSION_TYPES`)
- **Armazenamento:** Tabela `Permission` (memberId + type)
- **ADMINGERAL:** Recebe todas as permissões automaticamente
- **MEMBER (via invite):** Recebe apenas `members_view`

#### Validação de Permissões
- **Backend:** `backend/src/utils/authorization.ts`
- **Funções:**
  - `hasAccess(member, permissionType)`: Verifica se Member tem permissão
  - `validateMemberCreationPermission()`: Valida criação de membros
  - `checkPlanMembersLimit()`: Valida limite de membros do plano

### Tratamento de Token Expirado/Inválido

#### Backend
- **Middleware:** `authenticate.ts` retorna 401 se token inválido/expirado

#### Mobile
- **Interceptor:** `mobile/src/api/api.ts` (linha 100-104)
- **Ação:** Se 401:
  - Remove token do axios (`removeToken()`)
  - Limpa store (`logout()`)
  - **Problema:** Não redireciona para Login automaticamente

---

## ⚠️ Tratamento de Estados e Casos Extremos

### Estados de Loading

#### Mobile
- **LoginScreen:** `loading` state durante login
- **RegisterScreen:** `loading` state durante registro
- **RegisterInviteScreen:** `validating` + `loading` states
- **ChurchScreen:** `loading` state durante criação
- **DashboardScreen:** `loading` state inicial

#### Backend
- Não há estados de loading explícitos (síncrono)

### Estados de Erro

#### Mobile
- **Toast messages:** Usado para erros de validação/API
- **Error states:** `error` state em várias telas
- **Retry:** Função `handleRetry` em algumas telas

#### Backend
- **Códigos HTTP:**
  - 400: Validação (ZodError)
  - 401: Não autenticado / Token inválido
  - 403: Sem permissão / Limite atingido
  - 404: Recurso não encontrado
  - 500: Erro interno

### Comportamento Offline/Timeout

#### Mobile
- **Timeout:** 30 segundos (`api.ts:37`)
- **Erro de rede:** Logado mas não tratado (não bloqueia UI)
- **Sem refresh automático:** Usuário precisa fazer pull-to-refresh

#### Backend
- Não há tratamento específico de offline

### Retry Behavior

#### Mobile
- **Pull-to-refresh:** Implementado em várias telas via `RefreshControl`
- **useFocusEffect:** Recarrega dados quando tela ganha foco
- **Retry manual:** Botão "Tentar novamente" em algumas telas

---

## 🚫 Restrições Conhecidas

### Limites de Plano

#### Validação
- **Arquivo:** `backend/src/utils/planLimits.ts`
- **Funções:**
  - `checkPlanMembersLimit(userId)`: Verifica `maxMembers`
  - `checkPlanBranchesLimit(userId)`: Verifica `maxBranches`

#### Lógica
1. Busca Subscription ativa do User
2. Se não encontrar, busca Subscription do ADMINGERAL da igreja
3. Se `maxMembers === null` → ilimitado
4. Conta membros de todas as branches da igreja
5. Se `totalMembers >= maxMembers` → lança erro

#### Onde é Verificado
- **Criação de membros:** `registerService.ts` (linha 6)
- **Criação de links de convite:** `inviteLinkService.ts` (linha 3)
- **Validação de invite link:** `inviteLinkService.ts` (linha 182-277)

### MemberLimitReached

#### Trigger
- **Quando:** `checkPlanMembersLimit()` lança erro
- **Onde:** 
  - Registro via invite (se limite atingido)
  - Criação de link de convite (se limite atingido)

#### Fluxo
1. Backend retorna erro `LIMIT_REACHED` (403)
2. Mobile detecta `error === 'LIMIT_REACHED'`
3. Navega para `MemberLimitReachedScreen`
4. Tela mostra mensagem e opção de ir para Login

#### Arquivos
- **Backend:** `backend/src/utils/planLimits.ts` (linha 142)
- **Mobile:** `mobile/src/screens/MemberLimitReachedScreen.tsx`

### Subscription/Checkout Flow

#### Status
- **Implementado:** Estrutura básica (Plan, Subscription models)
- **Não implementado:** Checkout completo, pagamento, webhooks

#### Arquivos
- **Models:** `backend/prisma/schema.prisma` (linhas 172-213)
- **Routes:** `backend/src/routes/subscriptionRoutes.ts`
- **Routes:** `backend/src/routes/planRoutes.ts`

---

## 🐛 Gaps e Riscos de Bugs

### 🔴 ALTA SEVERIDADE

#### 1. Usuário sem Member fica preso
- **Onde:** Registro padrão se criação de igreja falhar
- **Arquivo:** `mobile/src/screens/RegisterScreen.tsx` (linha 99-120)
- **Problema:** 
  - Usuário cria conta mas não tem Member
  - Token não tem `memberId`/`branchId`/`role`
  - Login redireciona para onboarding, mas pode falhar novamente
- **Fix sugerido:**
  - Tornar criação de igreja obrigatória no registro
  - Ou criar Member temporário sem branch
  - Ou forçar onboarding antes de permitir acesso

#### 2. Onboarding pode ser pulado
- **Onde:** `SettingsOnboarding` permite pular e ir direto para `Main`
- **Arquivo:** `mobile/src/screens/onboarding/SettingsScreen.tsx` (linha 107)
- **Problema:**
  - Usuário pode navegar para `Main` sem ter Member
  - Dashboard tenta buscar `/members/me` → 404
- **Fix sugerido:**
  - Verificar `memberId` antes de permitir navegar para `Main`
  - Forçar conclusão do onboarding

#### 3. Token não atualizado após criar igreja
- **Onde:** `RegisterScreen.tsx` não atualiza token após criar igreja
- **Arquivo:** `mobile/src/screens/RegisterScreen.tsx` (linha 90-94)
- **Problema:**
  - Backend retorna novo token em `POST /churches`, mas mobile não usa
  - Token continua sem `memberId`/`branchId`/`role`
- **Fix sugerido:**
  - Extrair `token` de `response.data.token` e chamar `setUserFromToken()`
  - Mesmo padrão usado em `ChurchScreen.tsx` (linha 81-82)

#### 4. Validação de limite pode falhar silenciosamente
- **Onde:** `checkPlanMembersLimit()` pode não encontrar plano
- **Arquivo:** `backend/src/utils/planLimits.ts` (linha 121)
- **Problema:**
  - Se não encontrar plano, lança erro genérico
  - Pode permitir criação mesmo sem plano válido
- **Fix sugerido:**
  - Garantir que sempre há plano Free disponível (seed)
  - Criar plano Free automaticamente se não existir

### 🟡 MÉDIA SEVERIDADE

#### 5. Não há refresh token
- **Onde:** Token expira em 7 dias sem renovação
- **Arquivo:** `backend/src/routes/auth/login.ts` (linha 33)
- **Problema:**
  - Usuário precisa fazer login novamente após 7 dias
  - Não há renovação automática
- **Fix sugerido:**
  - Implementar refresh token
  - Ou aumentar expiração para 30 dias
  - Ou renovar token automaticamente antes de expirar

#### 6. Interceptor não redireciona para Login em 401
- **Onde:** `mobile/src/api/api.ts` (linha 100-104)
- **Problema:**
  - Remove token mas não navega para Login
  - Usuário pode ficar em tela protegida sem autenticação
- **Fix sugerido:**
  - Adicionar navegação para Login após logout
  - Usar `navigation.reset()` para limpar stack

#### 7. Campos inválidos no onboarding podem causar erro
- **Onde:** `ChurchScreen.tsx` envia campos que não existem no schema
- **Arquivo:** `mobile/src/screens/onboarding/ChurchScreen.tsx` (linha 80-84)
- **Problema:**
  - Já corrigido (removidos `country`, `city`, `language`, `primaryColor`)
  - Mas pode haver outros campos não validados
- **Fix sugerido:**
  - Validar payload antes de enviar
  - Usar TypeScript strict para garantir tipos

#### 8. Validação de invite link no client pode estar desatualizada
- **Onde:** `RegisterInviteScreen.tsx` valida `expiresAt` no client
- **Arquivo:** `mobile/src/screens/RegisterInviteScreen.tsx` (linha 81)
- **Problema:**
  - Validação client-side pode não considerar timezone corretamente
  - Backend usa `normalizeExpirationDate` que trata fim do dia
- **Fix sugerido:**
  - Remover validação client-side de expiração
  - Deixar apenas backend validar

### 🟢 BAIXA SEVERIDADE

#### 9. SettingsOnboarding não cria roles/envia convites
- **Onde:** `SettingsScreen.tsx` apenas mostra UI
- **Arquivo:** `mobile/src/screens/onboarding/SettingsScreen.tsx` (linha 38-118)
- **Problema:**
  - Step 1 e Step 3 são apenas placeholders
  - Não há integração com backend
- **Fix sugerido:**
  - Implementar endpoints para criar roles
  - Implementar envio de convites por email

#### 10. ConcluidoScreen não é usado
- **Onde:** Tela existe mas não é referenciada no fluxo
- **Arquivo:** `mobile/src/screens/onboarding/ConcluidoScreen.tsx`
- **Problema:**
  - Código morto
- **Fix sugerido:**
  - Remover ou integrar no fluxo

#### 11. AsyncStorage usado para estado temporário
- **Onde:** `onboarding_structure`, `onboarding_modules`
- **Arquivo:** `mobile/src/screens/onboarding/StartScreen.tsx` (linha 20)
- **Problema:**
  - Estado pode ficar "sujo" se onboarding for interrompido
- **Fix sugerido:**
  - Limpar AsyncStorage após onboarding completo
  - Ou usar estado local ao invés de AsyncStorage

---

## 📊 Tabela de Interações com DB por Fluxo

| Fluxo | User | Subscription | Plan | Church | Branch | Member | Permission | MemberInviteLink |
|-------|------|--------------|------|--------|--------|--------|------------|------------------|
| **A: Registro Padrão** | CREATE | CREATE | READ | CREATE* | CREATE* | CREATE* | CREATE* | - |
| **B: Login** | READ | READ | READ | READ | READ | READ | READ | - |
| **C: Registro via Invite** | CREATE | - | READ | READ | READ | CREATE | CREATE | READ, UPDATE |
| **D: Onboarding** | READ | READ | READ | CREATE | CREATE | CREATE/UPDATE | CREATE | - |

*Opcional: apenas se criação de igreja for bem-sucedida

---

## 🔍 Checklist de Gaps por Categoria

### Autenticação
- [ ] ❌ Refresh token não implementado
- [ ] ⚠️ Token não atualizado após criar igreja (RegisterScreen)
- [ ] ⚠️ Interceptor não redireciona para Login em 401
- [ ] ✅ Token armazenado corretamente (AsyncStorage + axios)

### Onboarding
- [ ] ❌ Onboarding pode ser pulado
- [ ] ❌ SettingsOnboarding não cria roles/envia convites
- [ ] ⚠️ AsyncStorage usado para estado temporário
- [ ] ✅ ChurchOnboarding cria Member corretamente

### Registro
- [ ] ❌ Usuário pode ficar sem Member (se criação de igreja falhar)
- [ ] ⚠️ Validação de limite pode falhar silenciosamente
- [ ] ✅ Registro via invite funciona corretamente

### Validações
- [ ] ⚠️ Validação client-side de invite link pode estar desatualizada
- [ ] ✅ Validação de limites de plano implementada
- [ ] ✅ Validação de permissões implementada

### Navegação
- [ ] ✅ Guards de navegação implementados (LoginScreen)
- [ ] ⚠️ Dashboard verifica memberId antes de buscar avatar
- [ ] ✅ Navegação baseada em branchId/role

---

## 📝 Notas Finais

### Pontos Fortes
1. ✅ Estrutura de autenticação bem definida (JWT)
2. ✅ Validação de limites de plano implementada
3. ✅ Registro via invite link funcional
4. ✅ Onboarding estruturado (mesmo que incompleto)
5. ✅ Interceptor axios adiciona token automaticamente

### Pontos de Atenção
1. ⚠️ Usuário pode ficar em estado inconsistente (sem Member)
2. ⚠️ Token não é atualizado em todos os cenários
3. ⚠️ Onboarding pode ser pulado
4. ⚠️ Não há refresh token

### Recomendações Prioritárias
1. **URGENTE:** Garantir que usuário sempre tem Member após registro
2. **URGENTE:** Atualizar token após criar igreja no RegisterScreen
3. **ALTA:** Implementar refresh token ou aumentar expiração
4. **MÉDIA:** Completar implementação de SettingsOnboarding
5. **BAIXA:** Limpar código morto (ConcluidoScreen)

---

**Fim do Relatório**


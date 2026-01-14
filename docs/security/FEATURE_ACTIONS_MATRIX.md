# Matriz de Features e Ações - Revisão de Segurança

**Data de Criação:** 2025-02-01  
**Versão:** 1.0  
**Propósito:** Documentação completa de todos os módulos, features e ações do sistema para revisão de segurança

---

## 📋 Índice

1. [Autenticação e Autorização](#1-autenticação-e-autorização)
2. [Igrejas (Churches)](#2-igrejas-churches)
3. [Filiais (Branches)](#3-filiais-branches)
4. [Membros (Members)](#4-membros-members)
5. [Eventos (Events)](#5-eventos-events)
6. [Devocionais (Devotionals)](#6-devocionais-devotionals)
7. [Contribuições (Contributions)](#7-contribuições-contributions)
8. [Finanças (Finances)](#8-finanças-finances)
9. [Avisos (Notices)](#9-avisos-notices)
10. [Horários de Culto (Service Schedules)](#10-horários-de-culto-service-schedules)
11. [Cargos (Positions)](#11-cargos-positions)
12. [Permissões (Permissions)](#12-permissões-permissions)
13. [Links de Convite (Invite Links)](#13-links-de-convite-invite-links)
14. [Onboarding](#14-onboarding)
15. [Assinaturas e Planos (Subscriptions & Plans)](#15-assinaturas-e-planos-subscriptions--plans)
16. [Pagamentos (Payments)](#16-pagamentos-payments)
17. [Upload de Arquivos](#17-upload-de-arquivos)
18. [Auditoria (Audit)](#18-auditoria-audit)
19. [Admin (SaaS Admin)](#19-admin-saas-admin)

---

## 🔑 Legenda

- **Tenant Scope:**
  - `churchId`: Escopo ao nível da igreja
  - `branchId`: Escopo ao nível da filial
  - `userId`: Escopo ao nível do usuário
  - `global`: Escopo global (sem tenant)

- **Roles:**
  - `ADMINGERAL`: Administrador Geral da Igreja
  - `ADMINFILIAL`: Administrador da Filial
  - `COORDINATOR`: Coordenador
  - `MEMBER`: Membro
  - `SAAS_ADMIN`: Administrador do SaaS (sistema)

- **Permissions:**
  - `devotional_manage`: Gerenciar devocionais
  - `members_view`: Visualizar membros
  - `members_manage`: Gerenciar membros
  - `events_manage`: Gerenciar eventos
  - `contributions_manage`: Gerenciar contribuições
  - `finances_manage`: Gerenciar finanças
  - `church_manage`: Gerenciar igreja

---

## 1. Autenticação e Autorização

### 1.1. Registro Público (Landing Page)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Registrar novo usuário | `/public/register` | POST | `web/src/pages/Register.tsx` | `mobile/src/screens/RegisterScreen.tsx` | User, Subscription | `userId` | ❌ Não | N/A (público) |

**Detalhes:**
- Cria `User` e `Subscription` (plano Free)
- Retorna JWT token para login imediato
- Campos obrigatórios: `firstName`, `lastName`, `email`, `password`, `phone`, `document`

### 1.2. Registro via Link de Convite

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Registrar membro via convite | `/public/register/invite` | POST | `web/src/pages/RegisterInvite.tsx` | `mobile/src/screens/RegisterInviteScreen.tsx` | User, Member, MemberInviteLink | `branchId` | ❌ Não | N/A (público) |

**Detalhes:**
- Valida token do link de convite
- Verifica limite de membros do plano
- Cria `User` e `Member` vinculados ao `branchId` do link
- Retorna JWT token

### 1.3. Login

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Fazer login | `/auth/login` | POST | `web/src/pages/Login.tsx` | `mobile/src/screens/LoginScreen.tsx` | User, Member | `userId`, `memberId` | ❌ Não | N/A (público) |

**Detalhes:**
- Autentica User ou Member
- Retorna JWT com contexto completo (role, branchId, permissions)

### 1.4. Registro Interno (Criar Membro)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar membro interno | `/register` | POST | `web/src/pages/Members/AddMember.tsx` | `mobile/src/screens/MemberRegistrationScreen.tsx` | User, Member | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `members_manage`) |

**Detalhes:**
- Valida permissões e hierarquia de roles
- Cria `User` e `Member` na filial especificada
- Atribui role e permissões conforme criador

---

## 2. Igrejas (Churches)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar igreja | `/churches` | POST | `web/src/pages/onboarding/Church.tsx` | `mobile/src/screens/onboarding/ChurchScreen.tsx` | Church, Branch, Member | `churchId` | ✅ Sim | User (qualquer usuário autenticado) |
| Listar igrejas | `/churches` | GET | `web/src/pages/Dashboard.tsx` | `mobile/src/screens/DashboardScreen.tsx` | Church | `churchId` | ✅ Sim | User |
| Obter igreja por ID | `/churches/:id` | GET | `web/src/pages/onboarding/Church.tsx` | `mobile/src/screens/onboarding/ChurchScreen.tsx` | Church | `churchId` | ✅ Sim | User |
| Atualizar igreja | `/churches/:id` | PUT | `web/src/pages/onboarding/Church.tsx` | `mobile/src/screens/onboarding/ChurchScreen.tsx` | Church | `churchId` | ✅ Sim | ADMINGERAL |
| Deletar igreja | `/churches/:id` | DELETE | N/A | N/A | Church | `churchId` | ✅ Sim | ADMINGERAL |
| Desativar igreja | `/churches/:id/deactivate` | PATCH | N/A | N/A | Church | `churchId` | ✅ Sim | ADMINGERAL |

**Detalhes:**
- Criação de igreja também cria `Branch` (Sede) e `Member` (ADMINGERAL)
- Atualização e deleção restritas a ADMINGERAL
- Escopo: `churchId` (isolamento por igreja)

---

## 3. Filiais (Branches)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar filial | `/branches` | POST | `web/src/pages/onboarding/Branches.tsx` | `mobile/src/screens/onboarding/BranchesScreen.tsx` | Branch | `churchId` | ✅ Sim | ADMINGERAL |
| Listar filiais | `/branches` | GET | `web/src/pages/onboarding/Branches.tsx` | `mobile/src/screens/onboarding/BranchesScreen.tsx` | Branch | `churchId` | ✅ Sim | User |
| Deletar filial | `/branches/:id` | DELETE | `web/src/pages/onboarding/Branches.tsx` | `mobile/src/screens/onboarding/BranchesScreen.tsx` | Branch | `churchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL |

**Detalhes:**
- Criação restrita a ADMINGERAL
- Verifica limite de branches do plano (`maxBranches`)
- Não permite deletar filial principal (`isMainBranch: true`)
- Escopo: `churchId` (filiais isoladas por igreja)

---

## 4. Membros (Members)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar membros | `/members` | GET | `web/src/pages/Members/index.tsx` | `mobile/src/screens/MembersListScreen.tsx` | Member | `branchId` | ✅ Sim | User (filtrado por role) |
| Obter meu perfil | `/members/me` | GET | `web/src/pages/Profile/index.tsx` | `mobile/src/screens/ProfileScreen.tsx` | Member | `userId` | ✅ Sim | User |
| Obter membro por ID | `/members/:id` | GET | `web/src/pages/Members/MemberDetails.tsx` | `mobile/src/screens/MemberDetailsScreen.tsx` | Member | `branchId` | ✅ Sim | User (com validação de acesso) |
| Atualizar membro | `/members/:id` | PUT | `web/src/pages/Members/MemberDetails.tsx` | `mobile/src/screens/EditProfileScreen.tsx` | Member | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, ou próprio membro |
| Atualizar role do membro | `/members/:id/role` | PATCH | `web/src/pages/Members/MemberDetails.tsx` | `mobile/src/screens/MemberDetailsScreen.tsx` | Member, Permission | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL |

**Detalhes:**
- Listagem filtrada por role:
  - ADMINGERAL: vê todos os membros da igreja
  - ADMINFILIAL/COORDINATOR: vê apenas membros da sua filial
  - MEMBER: vê apenas a si mesmo
- Atualização de role atribui permissões padrão automaticamente
- Escopo: `branchId` (membros isolados por filial)

---

## 5. Eventos (Events)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar eventos | `/events` | GET | `web/src/pages/Events/index.tsx` | `mobile/src/screens/EventsScreen.tsx` | Event | `branchId` | ✅ Sim | User |
| Obter próximo evento | `/events/next` | GET | `web/src/pages/Dashboard.tsx` | `mobile/src/screens/DashboardScreen.tsx` | Event | `branchId` | ✅ Sim | User |
| Obter evento por ID | `/events/:id` | GET | `web/src/pages/Events/EventDetails.tsx` | `mobile/src/screens/EventDetailsScreen.tsx` | Event | `branchId` | ✅ Sim | User |
| Criar evento | `/events` | POST | `web/src/pages/Events/AddEvent.tsx` | `mobile/src/screens/AddEventScreen.tsx` | Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `events_manage`) |
| Atualizar evento | `/events/:id` | PUT | `web/src/pages/Events/EditEvent.tsx` | `mobile/src/screens/EditEventScreen.tsx` | Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `events_manage`) |
| Deletar evento | `/events/:id` | DELETE | `web/src/pages/Events/EventDetails.tsx` | `mobile/src/screens/EventDetailsScreen.tsx` | Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `events_manage`) |

**Detalhes:**
- Listagem filtrada por `branchId` do usuário
- Criação/atualização/deleção requerem `events_manage` ou role admin
- Escopo: `branchId` (eventos isolados por filial)

---

## 6. Devocionais (Devotionals)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar devocionais | `/devotionals` | GET | `web/src/pages/Devotionals/index.tsx` | `mobile/src/screens/DevotionalsScreen.tsx` | Devotional | `branchId` | ✅ Sim | User |
| Obter devocional por ID | `/devotionals/:id` | GET | `web/src/pages/Devotionals/DevotionalDetails.tsx` | `mobile/src/screens/DevotionalDetailScreen.tsx` | Devotional | `branchId` | ✅ Sim | User |
| Criar devocional | `/devotionals` | POST | `web/src/pages/Devotionals/AddDevotional.tsx` | `mobile/src/screens/AddDevotionalScreen.tsx` | Devotional | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `devotional_manage`) |
| Atualizar devocional | `/devotionals/:id` | PUT | `web/src/pages/Devotionals/AddDevotional.tsx` | `mobile/src/screens/AddDevotionalScreen.tsx` | Devotional | `branchId` | ✅ Sim | Autor ou com `devotional_manage` |
| Deletar devocional | `/devotionals/:id` | DELETE | `web/src/pages/Devotionals/DevotionalDetails.tsx` | `mobile/src/screens/DevotionalDetailScreen.tsx` | Devotional | `branchId` | ✅ Sim | Autor ou com `devotional_manage` |
| Curtir devocional | `/devotionals/:id/like` | POST | `web/src/pages/Devotionals/DevotionalDetails.tsx` | `mobile/src/screens/DevotionalDetailScreen.tsx` | DevotionalLike | `branchId` | ✅ Sim | User |
| Descurtir devocional | `/devotionals/:id/unlike` | DELETE | `web/src/pages/Devotionals/DevotionalDetails.tsx` | `mobile/src/screens/DevotionalDetailScreen.tsx` | DevotionalLike | `branchId` | ✅ Sim | User |

**Detalhes:**
- Listagem filtrada por `branchId`
- Autor pode editar/deletar seus próprios devocionais
- Escopo: `branchId` (devocionais isolados por filial)

---

## 7. Contribuições (Contributions)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar contribuições | `/contributions` | GET | `web/src/pages/Contributions/index.tsx` | `mobile/src/screens/ContributionsScreen.tsx` | Contribution | `branchId` | ✅ Sim | User |
| Obter contribuição por ID | `/contributions/:id` | GET | `web/src/pages/Contributions/ContributionDetails.tsx` | `mobile/src/screens/ContributionDetailScreen.tsx` | Contribution | `branchId` | ✅ Sim | User |
| Criar contribuição | `/contributions` | POST | `web/src/pages/Contributions/AddContribution.tsx` | `mobile/src/screens/AddContributionsScreen.tsx` | Contribution, ContributionPaymentMethod | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `contributions_manage`) |
| Atualizar contribuição | `/contributions/:id` | PUT | `web/src/pages/Contributions/EditContribution.tsx` | `mobile/src/screens/EditContributionScreen.tsx` | Contribution, ContributionPaymentMethod | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `contributions_manage`) |
| Alternar status ativo/inativo | `/contributions/:id/toggle-active` | PATCH | `web/src/pages/Contributions/ContributionDetails.tsx` | `mobile/src/screens/ContributionDetailScreen.tsx` | Contribution | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `contributions_manage`) |
| Deletar contribuição | `/contributions/:id` | DELETE | `web/src/pages/Contributions/ContributionDetails.tsx` | `mobile/src/screens/ContributionDetailScreen.tsx` | Contribution | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `contributions_manage`) |

**Detalhes:**
- Listagem filtrada por `branchId`
- Criação/atualização/deleção requerem `contributions_manage` ou role admin
- Escopo: `branchId` (contribuições isoladas por filial)

---

## 8. Finanças (Finances)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar transações e resumo | `/finances` | GET | `web/src/pages/Finances/index.tsx` | `mobile/src/screens/FinancesScreen.tsx` | Transaction | `branchId` | ✅ Sim | User |
| Obter transação por ID | `/finances/:id` | GET | `web/src/pages/Finances/TransactionDetails.tsx` | `mobile/src/screens/TransactionDetailsScreen.tsx` | Transaction | `branchId` | ✅ Sim | User |
| Criar transação | `/finances` | POST | `web/src/pages/Finances/AddTransaction.tsx` | `mobile/src/screens/AddTransactionScreen.tsx` | Transaction | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `finances_manage`) |
| Atualizar transação | `/finances/:id` | PUT | `web/src/pages/Finances/EditTransaction.tsx` | `mobile/src/screens/EditTransactionScreen.tsx` | Transaction | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `finances_manage`) |
| Deletar transação | `/finances/:id` | DELETE | `web/src/pages/Finances/TransactionDetails.tsx` | `mobile/src/screens/TransactionDetailsScreen.tsx` | Transaction | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `finances_manage`) |

**Detalhes:**
- Listagem inclui resumo financeiro (total, entradas, saídas)
- Filtros opcionais: `startDate`, `endDate`, `category`, `type`, `search`
- Criação/atualização/deleção requerem `finances_manage` ou role admin
- Escopo: `branchId` (transações isoladas por filial)

---

## 9. Avisos (Notices)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar avisos | `/notices` | GET | `web/src/pages/Notices/index.tsx` | `mobile/src/screens/NoticesScreen.tsx` | Notice | `branchId` | ✅ Sim | User |
| Criar aviso | `/notices` | POST | `web/src/pages/Notices/AddNotice.tsx` | `mobile/src/screens/AddNoticeScreen.tsx` | Notice | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `members_manage`) |
| Marcar aviso como lido | `/notices/:id/read` | POST | `web/src/pages/Notices/index.tsx` | `mobile/src/screens/NoticesScreen.tsx` | Notice | `branchId` | ✅ Sim | User |
| Deletar aviso | `/notices/:id` | DELETE | `web/src/pages/Notices/index.tsx` | `mobile/src/screens/NoticesScreen.tsx` | Notice | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `members_manage`) |

**Detalhes:**
- Listagem filtrada por `branchId` com flag `read` indicando se foi lido pelo usuário
- Criação/deleção requerem `members_manage` ou role admin
- Escopo: `branchId` (avisos isolados por filial)

---

## 10. Horários de Culto (Service Schedules)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar horário | `/service-schedules` | POST | `web/src/pages/ChurchSettings/ServiceScheduleForm.tsx` | `mobile/src/screens/ServiceScheduleFormScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`) |
| Listar horários por filial | `/service-schedules/branch/:branchId` | GET | `web/src/pages/ChurchSettings/ServiceScheduleList.tsx` | `mobile/src/screens/ChurchSettingsScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR, MEMBER |
| Obter horário por ID | `/service-schedules/:id` | GET | `web/src/pages/ChurchSettings/ServiceScheduleForm.tsx` | `mobile/src/screens/ServiceScheduleFormScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR, MEMBER |
| Atualizar horário | `/service-schedules/:id` | PUT | `web/src/pages/ChurchSettings/ServiceScheduleForm.tsx` | `mobile/src/screens/ServiceScheduleFormScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`) |
| Contar eventos relacionados | `/service-schedules/:id/related-events-count` | GET | `web/src/pages/ChurchSettings/ServiceScheduleList.tsx` | `mobile/src/screens/ChurchSettingsScreen.tsx` | Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`) |
| Deletar horário | `/service-schedules/:id` | DELETE | `web/src/pages/ChurchSettings/ServiceScheduleList.tsx` | `mobile/src/screens/ChurchSettingsScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`) |
| Definir horário como padrão | `/service-schedules/:id/set-default` | PATCH | `web/src/pages/ChurchSettings/ServiceScheduleList.tsx` | `mobile/src/screens/ChurchSettingsScreen.tsx` | ServiceSchedule | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`) |
| Criar eventos a partir do horário | `/service-schedules/:id/create-events` | POST | `web/src/pages/ChurchSettings/ServiceScheduleList.tsx` | `mobile/src/screens/ChurchSettingsScreen.tsx` | ServiceSchedule, Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `church_manage`, `events_manage`) |

**Detalhes:**
- Criação/atualização/deleção requerem `church_manage` ou role admin
- Listagem e visualização disponíveis para todos os membros
- Escopo: `branchId` (horários isolados por filial)

---

## 11. Cargos (Positions)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar cargos | `/positions` | GET | `web/src/pages/Positions/index.tsx` | `mobile/src/screens/PositionsScreen.tsx` | ChurchPosition | `churchId` | ✅ Sim | User |
| Criar cargo | `/positions` | POST | `web/src/pages/Positions/index.tsx` | `mobile/src/screens/PositionsScreen.tsx` | ChurchPosition | `churchId` | ✅ Sim | ADMINGERAL |
| Atualizar cargo | `/positions/:id` | PUT | `web/src/pages/Positions/index.tsx` | `mobile/src/screens/PositionsScreen.tsx` | ChurchPosition | `churchId` | ✅ Sim | ADMINGERAL |
| Deletar cargo | `/positions/:id` | DELETE | `web/src/pages/Positions/index.tsx` | `mobile/src/screens/PositionsScreen.tsx` | ChurchPosition | `churchId` | ✅ Sim | ADMINGERAL |

**Detalhes:**
- Todas as operações restritas a ADMINGERAL
- Escopo: `churchId` (cargos isolados por igreja)

---

## 12. Permissões (Permissions)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todas as permissões | `/permissions/all` | GET | `web/src/pages/Permissions/index.tsx` | `mobile/src/screens/PermissionsScreen.tsx` | Permission | `global` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR |
| Atribuir permissões a membro | `/permissions/:id` | POST | `web/src/pages/Permissions/index.tsx` | `mobile/src/screens/ManagePermissionsScreen.tsx` | Permission | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL |

**Detalhes:**
- Atribuição de permissões restrita a ADMINGERAL e ADMINFILIAL
- Permissões disponíveis: `devotional_manage`, `members_view`, `members_manage`, `events_manage`, `contributions_manage`, `finances_manage`, `church_manage`
- Escopo: `branchId` (permissões isoladas por filial)

---

## 13. Links de Convite (Invite Links)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar link de convite | `/invite-links` | POST | `web/src/pages/Members/InviteLinks.tsx` | `mobile/src/screens/InviteLinksScreen.tsx` | MemberInviteLink | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `members_manage`) |
| Listar links por filial | `/invite-links/branch/:branchId` | GET | `web/src/pages/Members/InviteLinks.tsx` | `mobile/src/screens/InviteLinksScreen.tsx` | MemberInviteLink | `branchId` | ✅ Sim | User |
| Desativar link | `/invite-links/:id/deactivate` | PATCH | `web/src/pages/Members/InviteLinks.tsx` | `mobile/src/screens/InviteLinksScreen.tsx` | MemberInviteLink | `branchId` | ✅ Sim | User |
| Obter QR code | `/invite-links/:token/qrcode` | GET | `web/src/pages/Members/InviteLinks.tsx` | `mobile/src/screens/InviteLinkScreen.tsx` | MemberInviteLink | `global` | ❌ Não | N/A (público) |
| Download PDF | `/invite-links/:token/pdf` | GET | `web/src/pages/Members/InviteLinks.tsx` | `mobile/src/screens/InviteLinkScreen.tsx` | MemberInviteLink | `global` | ❌ Não | N/A (público) |
| Obter informações do link | `/invite-links/:token/info` | GET | `web/src/pages/RegisterInvite.tsx` | `mobile/src/screens/RegisterInviteScreen.tsx` | MemberInviteLink | `global` | ❌ Não | N/A (público) |

**Detalhes:**
- Criação requer `members_manage` ou role admin
- QR code e PDF são públicos (não requerem autenticação)
- Escopo: `branchId` (links isolados por filial)

---

## 14. Onboarding

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Obter estado do onboarding | `/onboarding/state` | GET | `web/src/pages/onboarding/Start.tsx` | `mobile/src/screens/onboarding/StartScreen.tsx` | OnboardingProgress | `userId` | ✅ Sim | User |
| Obter progresso | `/onboarding/progress` | GET | `web/src/pages/onboarding/Start.tsx` | `mobile/src/screens/onboarding/StartScreen.tsx` | OnboardingProgress | `userId` | ✅ Sim | User |
| Marcar passo como completo | `/onboarding/progress/:step` | POST | `web/src/pages/onboarding/*.tsx` | `mobile/src/screens/onboarding/*.tsx` | OnboardingProgress | `userId` | ✅ Sim | User |
| Completar onboarding | `/onboarding/complete` | POST | `web/src/pages/onboarding/Concluido.tsx` | `mobile/src/screens/onboarding/ConcluidoScreen.tsx` | OnboardingProgress | `userId` | ✅ Sim | User |

**Detalhes:**
- Escopo: `userId` (onboarding isolado por usuário)

---

## 15. Assinaturas e Planos (Subscriptions & Plans)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Obter minha assinatura | `/subscriptions/me` | GET | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription, Plan | `userId` | ✅ Sim | User |
| Obter minha assinatura (alias) | `/subscriptions/current` | GET | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription, Plan | `userId` | ✅ Sim | User |
| Trocar de plano | `/subscriptions/change` | POST | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription, Plan | `userId` | ✅ Sim | User |
| Listar todas as assinaturas | `/subscriptions` | GET | N/A (Admin) | N/A (Admin) | Subscription | `global` | ✅ Sim | SAAS_ADMIN |
| Listar planos | `/plans` | GET | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Plan | `global` | ✅ Sim | User |

**Detalhes:**
- Operações de usuário escopo: `userId`
- Listagem de assinaturas (admin) escopo: `global`
- Escopo: `userId` (assinaturas isoladas por usuário)

---

## 16. Pagamentos (Payments)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Criar checkout | `/api/subscriptions/checkout` | POST | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription, PaymentHistory | `userId` | ✅ Sim | User |
| Obter assinatura | `/api/subscriptions` | GET | `web/src/pages/Subscription/Success.tsx` | `mobile/src/screens/SubscriptionSuccessScreen.tsx` | Subscription | `userId` | ✅ Sim | User |
| Cancelar assinatura | `/api/subscriptions/cancel` | POST | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription | `userId` | ✅ Sim | User |
| Retomar assinatura | `/api/subscriptions/resume` | POST | `web/src/pages/Subscription/index.tsx` | `mobile/src/screens/SubscriptionScreen.tsx` | Subscription | `userId` | ✅ Sim | User |
| Webhook de pagamento | `/api/webhooks/payment/:provider` | POST | N/A | N/A | PaymentHistory, WebhookEvent, Subscription | `global` | ❌ Não | Validação de assinatura |

**Detalhes:**
- Webhooks não requerem autenticação, mas validam assinatura do provider
- Escopo: `userId` (pagamentos isolados por usuário)

---

## 17. Upload de Arquivos

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Upload avatar do usuário | `/upload/avatar` | POST | `web/src/pages/Profile/index.tsx` | `mobile/src/screens/EditProfileScreen.tsx` | User, Member | `userId` | ✅ Sim | User |
| Upload avatar da igreja | `/upload/church-avatar` | POST | `web/src/pages/onboarding/Church.tsx` | `mobile/src/screens/onboarding/ChurchScreen.tsx` | Church | `churchId` | ✅ Sim | ADMINGERAL |
| Upload imagem de evento | `/upload/event-image` | POST | `web/src/pages/Events/AddEvent.tsx` | `mobile/src/screens/AddEventScreen.tsx` | Event | `branchId` | ✅ Sim | ADMINGERAL, ADMINFILIAL, COORDINATOR (com `events_manage`) |

**Detalhes:**
- Limite de arquivo: 5MB
- Escopo varia conforme tipo de upload

---

## 18. Auditoria (Audit)

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar logs de auditoria | `/audit` | GET | N/A | N/A | AuditLog | `global` | ✅ Sim | ADMINGERAL |
| Listar logs de membro | `/audit/members/:id` | GET | N/A | N/A | AuditLog | `branchId` | ✅ Sim | ADMINGERAL ou próprio membro |
| Listar logs de filial | `/audit/branches/:id` | GET | N/A | N/A | AuditLog | `churchId` | ✅ Sim | ADMINGERAL |
| Listar meus logs | `/audit/me` | GET | N/A | N/A | AuditLog | `userId` | ✅ Sim | User |

**Detalhes:**
- Listagem geral restrita a ADMINGERAL
- Logs de membro: ADMINGERAL pode ver qualquer membro, outros veem apenas próprios logs
- Filtros disponíveis: `userId`, `entityType`, `entityId`, `action`, `startDate`, `endDate`, `limit`, `offset`
- Escopo varia conforme tipo de log

---

## 19. Admin (SaaS Admin)

### 19.1. Dashboard

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Obter estatísticas | `/admin/dashboard/stats` | GET | N/A (Web-Admin) | N/A | User, Church, Member, Subscription | `global` | ✅ Sim | SAAS_ADMIN |

### 19.2. Usuários

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todos os usuários | `/admin/users` | GET | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Obter usuário por ID | `/admin/users/:id` | GET | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Bloquear usuário | `/admin/users/:id/block` | PATCH | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Desbloquear usuário | `/admin/users/:id/unblock` | PATCH | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Enviar reset de senha | `/admin/users/:id/reset-password` | POST | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Impersonar usuário | `/admin/users/:id/impersonate` | POST | N/A (Web-Admin) | N/A | User | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |

### 19.3. Igrejas

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todas as igrejas | `/admin/churches` | GET | N/A (Web-Admin) | N/A | Church | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Obter igreja por ID | `/admin/churches/:id` | GET | N/A (Web-Admin) | N/A | Church | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Listar filiais da igreja | `/admin/churches/:id/branches` | GET | N/A (Web-Admin) | N/A | Branch | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Listar membros da igreja | `/admin/churches/:id/members` | GET | N/A (Web-Admin) | N/A | Member | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Suspender igreja | `/admin/churches/:id/suspend` | PATCH | N/A (Web-Admin) | N/A | Church | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Reativar igreja | `/admin/churches/:id/reactivate` | PATCH | N/A (Web-Admin) | N/A | Church | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Alterar plano da igreja | `/admin/churches/:id/plan` | PATCH | N/A (Web-Admin) | N/A | Subscription, Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Impersonar dono da igreja | `/admin/churches/:id/impersonate` | POST | N/A (Web-Admin) | N/A | User, Church | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |

### 19.4. Membros

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todos os membros | `/admin/members` | GET | N/A (Web-Admin) | N/A | Member | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |
| Obter membro por ID | `/admin/members/:id` | GET | N/A (Web-Admin) | N/A | Member | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, SUPPORT) |

### 19.5. Planos

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todos os planos | `/admin/plans` | GET | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN |
| Obter plano por ID | `/admin/plans/:id` | GET | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN |
| Criar plano | `/admin/plans` | POST | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Atualizar plano | `/admin/plans/:id` | PATCH | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Ativar plano | `/admin/plans/:id/activate` | PATCH | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Desativar plano | `/admin/plans/:id/deactivate` | PATCH | N/A (Web-Admin) | N/A | Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |

### 19.6. Assinaturas

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar todas as assinaturas | `/admin/subscriptions` | GET | N/A (Web-Admin) | N/A | Subscription | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Obter assinatura por ID | `/admin/subscriptions/:id` | GET | N/A (Web-Admin) | N/A | Subscription | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Obter histórico da assinatura | `/admin/subscriptions/:id/history` | GET | N/A (Web-Admin) | N/A | PaymentHistory | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Alterar plano da assinatura | `/admin/subscriptions/:id/plan` | PATCH | N/A (Web-Admin) | N/A | Subscription, Plan | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Atualizar status da assinatura | `/admin/subscriptions/:id/status` | PATCH | N/A (Web-Admin) | N/A | Subscription | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Cancelar assinatura | `/admin/subscriptions/:id/cancel` | PATCH | N/A (Web-Admin) | N/A | Subscription | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |
| Reativar assinatura | `/admin/subscriptions/:id/reactivate` | PATCH | N/A (Web-Admin) | N/A | Subscription | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN, FINANCE) |

### 19.7. Configuração do Sistema

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Obter configuração | `/admin/config` | GET | N/A (Web-Admin) | N/A | SystemConfig | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |
| Atualizar configuração | `/admin/config` | PATCH | N/A (Web-Admin) | N/A | SystemConfig | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |

### 19.8. Auditoria Admin

| Ação | Endpoint | Método | UI Screen (Web) | UI Screen (Mobile) | Data Models | Tenant Scope | Auth Required | Roles/Permissions |
|------|----------|--------|-----------------|-------------------|-------------|--------------|---------------|------------------|
| Listar logs de auditoria | `/admin/audit` | GET | N/A (Web-Admin) | N/A | AuditLog | `global` | ✅ Sim | SAAS_ADMIN (SUPERADMIN) |

**Detalhes:**
- Todas as rotas admin requerem autenticação admin (`adminAuthenticate`)
- Roles admin: `SUPERADMIN`, `SUPPORT`, `FINANCE`
- Escopo: `global` (acesso a todos os tenants)

---

## 📊 Resumo por Escopo de Tenant

### Escopo `churchId`
- Igrejas (Churches)
- Cargos (Positions)
- Planos e Assinaturas (indiretamente)

### Escopo `branchId`
- Filiais (Branches)
- Membros (Members)
- Eventos (Events)
- Devocionais (Devotionals)
- Contribuições (Contributions)
- Finanças (Finances)
- Avisos (Notices)
- Horários de Culto (Service Schedules)
- Permissões (Permissions)
- Links de Convite (Invite Links)

### Escopo `userId`
- Onboarding
- Assinaturas (Subscriptions)
- Pagamentos (Payments)
- Upload de avatar do usuário

### Escopo `global`
- Admin (SaaS Admin)
- Auditoria (Audit) - parcialmente
- Planos (Plans) - listagem pública
- Links de Convite (Invite Links) - QR code e PDF públicos

---

## 🔒 Pontos Críticos de Segurança

1. **Isolamento Multi-Tenant:**
   - Todas as operações devem validar `churchId` ou `branchId` do usuário
   - Filtros automáticos por role (ADMINFILIAL só vê sua filial)
   - Validação de hierarquia (ADMINFILIAL não pode criar ADMINGERAL)

2. **Permissões Granulares:**
   - COORDINATOR requer permissões específicas para ações
   - ADMINGERAL e ADMINFILIAL têm todas as permissões automaticamente
   - Validação de permissão em cada endpoint crítico

3. **Endpoints Públicos:**
   - `/public/register` - Registro público (sem autenticação)
   - `/public/register/invite` - Registro via convite (sem autenticação)
   - `/invite-links/:token/qrcode` - QR code público
   - `/invite-links/:token/pdf` - PDF público
   - `/invite-links/:token/info` - Informações do link público
   - `/api/webhooks/payment/:provider` - Webhook (validação de assinatura)

4. **Admin (SaaS):**
   - Autenticação separada (`adminAuthenticate`)
   - Roles: `SUPERADMIN`, `SUPPORT`, `FINANCE`
   - Acesso global (sem isolamento de tenant)

5. **Auditoria:**
   - Logs de todas as ações críticas
   - Acesso restrito a ADMINGERAL (logs gerais)
   - Membros podem ver apenas seus próprios logs

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de Segurança  
**Versão:** 1.0

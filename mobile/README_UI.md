## Guia oficial de UI — ChurchPulse Mobile

Este documento descreve **como a UI está estruturada hoje** no app mobile (Expo/React Native), cobrindo:

- **Arquitetura de UI** (navegação, layouts e componentes reutilizáveis)
- **Implementação de cada página (screen)**: objetivo, seções, **posição/ordem dos campos**, regras de negócio e integrações (API/store/permissões)

> Fonte da verdade: código em `mobile/src/`.

## Índice

- [Arquitetura geral](#arquitetura-geral)
- [Navegação](#navegação)
- [Padrões de layout](#padrões-de-layout)
- [Padrão de formulários](#padrão-de-formulários)
- [Permissões e bloqueios](#permissões-e-bloqueios)
- [Catálogo de páginas](#catálogo-de-páginas)
  - [Autenticação e onboarding](#autenticação-e-onboarding)
  - [Dashboard](#dashboard)
  - [Agenda / eventos](#agenda--eventos)
  - [Avisos](#avisos)
  - [Devocionais](#devocionais)
  - [Contribuições](#contribuições)
  - [Finanças](#finanças)
  - [Membros e permissões](#membros-e-permissões)
  - [Igreja e horários de culto](#igreja-e-horários-de-culto)
  - [Assinaturas/planos](#assinaturasplanos)
  - [Perfil](#perfil)
  - [Mais (menu)](#mais-menu)

---

## Arquitetura geral

- **Stack principal**: `src/navigation/AppNavigator.tsx` (todas as telas, com `headerShown: false`).
- **Tabs**: `src/navigation/TabNavigator.tsx` (4 abas: Página Inicial, Agenda, Avisos, Mais).
- **Header global**:
  - O padrão atual usa `PageHeader` (fixo no topo, `position: 'absolute'`).
  - Muitas telas ajustam o conteúdo com `marginTop: 110` para não ficar sob o header.
- **Toasts globais**: configurados em `App.tsx` com `Toast config={toastConfig}` (`src/toastConfig.tsx`).

## Navegação

### Tabs (Bottom Tab)

- **Página Inicial** → `DashboardScreen`
- **Agenda** → `EventsScreen`
- **Avisos** → `NoticesScreen`
- **Mais** → `MoreScreen`

### Stack (principais rotas)

Definidas em `src/navigation/AppNavigator.tsx`. Exemplos relevantes:

- Auth: `Login`, `Register`
- Tabs: `Main`
- Eventos: `Events`, `AddEvent`, `EventDetails`, `EditEventScreen`
- Avisos: `Notices`, `AddNotice`
- Devocionais: `Devotionals`, `DevotionalDetails`, `AddDevotional`
- Contribuições: `Contributions`, `ContributionDetail`, `AddContributions`
- Finanças: `Finances`, `AddTransaction`, `EditTransaction`, `TransactionDetails`
- Membros: `MembersListScreen`, `MemberDetails`, `MemberRegistrationScreen`
- Permissões: `Permissions`, `ManagePermissions`, `EditMemberPermissions`
- Igreja: `ChurchSettings`, `ServiceScheduleForm`
- Assinatura: `Subscription`, `SubscriptionSuccess`
- Onboarding: `BemVindoOnboarding`, `StartOnboarding`, `ChurchOnboarding`, `BranchesOnboarding`, `SettingsOnboarding`, `ConvitesOnboarding`, `ConcluidoOnboarding`
- Erros/bloqueios: `Forbidden`, `MemberLimitReached`

---

## Padrões de layout

### `PageHeader`

Arquivo: `src/components/PageHeader.tsx`

- **Fixado no topo** (`position: 'absolute'`, `top: 0`, `zIndex: 1000`).
- Lado esquerdo:
  - Preferência para **logo/nome da igreja** quando `churchLogo`/`churchName` existem
  - Caso contrário, renderiza `Icon + title` (ou fallback “Igreja”)
- Lado direito:
  - Preferência para **avatar do usuário** (quando `userAvatar`/`userName` fornecidos)
  - Senão, renderiza `rightButtonIcon` (ex.: ícone “+” ou “editar”)

### `FormScreenLayout`

Arquivo: `src/components/layouts/FormScreenLayout.tsx`

- Renderiza `PageHeader` + `ScrollView` com:
  - `marginTop: 110` para liberar espaço do header
  - `keyboardShouldPersistTaps="handled"`
- Ideal para telas de formulário com muitos inputs.

### `DetailScreenLayout`

Arquivo: `src/components/layouts/DetailScreenLayout.tsx`

- Renderiza `PageHeader` + (opcional) **imagem de topo** (`imageUrl`) + conteúdo em `ScrollView`.
- Quando há imagem: `ScrollView` começa logo abaixo da imagem (sem `marginTop`).

---

## Padrão de formulários

### `FormsComponent`

Arquivo: `src/components/FormsComponent.tsx`

O `FormsComponent` é o **form builder oficial** do app para telas que usam configuração declarativa de campos.

#### Tipos suportados (prop `type`)

- `string` (padrão) — `TextInput`
- `number` — `keyboardType="numeric"`
- `email` — placeholder padrão `exemplo@email.com`, `autoCapitalize="none"`, `autoCorrect=false`
- `password` — placeholder padrão `••••••••`, `secureTextEntry`
- `date` — botão que abre `DateTimePickerModal`, valor salvo como `dd/MM/yyyy`
- `time` — componente `TimePicker` (string `HH:mm`)
- `image` — abre `expo-image-picker` e salva `uri` no campo
- `toggle` — `Switch`
- `select` — `react-native-modal-selector` (label exibido; value salvo no form)

#### Regras de UI do formulário

- **Posição dos campos**: a ordem visual é a ordem do array `fields`.
- **Obrigatório**: `required: true` adiciona `*` vermelho ao lado do label.
- **Dependências**: `dependsOn: 'campoBooleano'` só renderiza o campo quando o booleano está `true`.
- **Erros**:
  - `field.error` muda a borda do input e renderiza mensagem abaixo.
- **Botões**:
  - Rodapé com 2 ações: **Cancelar** (`navigation.goBack()`) e **Salvar** (`onSubmit`).

---

## Permissões e bloqueios

### Store e regra de permissão

- Store: `src/stores/authStore.ts` (Zustand + persist em AsyncStorage).
- Regra oficial: `hasAccess(user, permission)` em `src/utils/authUtils.ts`:
  - Acesso se `role` é `ADMINGERAL` ou `ADMINFILIAL` **ou** se usuário possui `permission` em `user.permissions[]`.

### `Protected`

Arquivo: `src/components/Protected.tsx`

- Se o usuário **não** tem a permissão exigida:
  - Mostra tela de “Acesso Negado”
  - CTA “Voltar ao Dashboard” → navega para `Dashboard`

### Páginas de bloqueio

- `ForbiddenScreen` (`src/screens/ForbiddenScreen.tsx`): 403 genérico com CTA “Voltar ao Dashboard”.
- `MemberLimitReachedScreen` (`src/screens/MemberLimitReachedScreen.tsx`): quando limite do plano é atingido via convite.
- `PlanUpgradeModal` (`src/components/PlanUpgradeModal.tsx`): modal de upgrade acionado por `PLAN_LIMIT_REACHED` em `InviteLinksScreen`.

---

## Catálogo de páginas

### Autenticação e onboarding

#### `LoginScreen` (`src/screens/LoginScreen.tsx`)

- **Objetivo**: autenticar usuário.
- **Campos (ordem)**:
  1. Email (`placeholder="exemplo@email.com"`)
  2. Senha (`secureTextEntry`, `placeholder="••••••••"`)
- **Regras de negócio**:
  - Bloqueia login se email/senha vazios.
  - POST `auth/login` → espera `{ token, user }`.
  - `setToken(token)` (axios) + `setUserFromToken(token)` (store).
  - Após ~100ms:
    - Se `user.branchId` ou `user.role` ausentes → navega para `StartOnboarding`
    - Senão → navega para `Main`

#### `RegisterScreen` (`src/screens/RegisterScreen.tsx`)

- **Objetivo**: criar conta e (tentar) criar igreja.
- **Campos (ordem)**:
  1. Nome completo *
  2. Email *
  3. Senha * (mín. 6)
  4. Nome da igreja *
- **Regras de negócio**:
  - Valida email por regex e senha >= 6.
  - Tenta registrar em `/register` (fallback `/public/register`).
  - Após registrar, tenta criar igreja: POST `/churches` com `{ withBranch: true, branchName: 'Sede' }`.
  - Se usuário ainda sem `branchId/role` → `navigation.replace('StartOnboarding')`; senão → `Dashboard`.
  - Se email já existe (409 ou mensagem) → erro específico.

#### Onboarding

- `BemVindoScreen`: card de boas-vindas → CTA `StartOnboarding`.
- `StartScreen`: escolhe estrutura (`simple` / `branches` / `existing`) e salva em AsyncStorage (`onboarding_structure`).
- `ChurchScreen`: cria/atualiza igreja:
  - Campos (ordem): Nome*, Cidade, Endereço
  - POST `/churches` (com `withBranch` se estrutura `branches`) ou PUT `/churches/:id`
  - Atualiza token via GET `/auth/me` e `setUserFromToken(token)`
  - Próximo: `BranchesOnboarding` (se branches) ou `SettingsOnboarding`
- `BranchesScreen`: cadastra filiais:
  - Lista de cards (mínimo “Sede”), campos por filial: Nome*, Cidade, Endereço
  - Cria/atualiza via POST `/branches` ou PUT `/branches/:id`
  - Próximo: `SettingsOnboarding`
- `SettingsScreen` (wizard 3 passos):
  1. Roles e permissões (placeholder; hoje só marca como “criado”)
  2. Ativar módulos (salva `onboarding_modules` em AsyncStorage)
  3. Convites por email (validação básica; sem endpoint real) → vai para `Main`
- `ConvitesScreen`: etapa “convite” alternativa (valida emails; sem endpoint) → `ConcluidoOnboarding`.
- `ConcluidoScreen`: finaliza → `Main`.

---

### Dashboard

#### `DashboardScreen` (`src/screens/DashboardScreen.tsx`)

- **Layout**: `PageHeader` com igreja (logo/nome) + avatar do usuário; conteúdo em `ScrollView` com `marginTop: 110`.
- **Seções (ordem)**:
  1. Título “Página inicial”
  2. Links rápidos: Eventos / Devocionais / Contribuições
  3. Banner “Próximo Evento” (imagem do evento ou fallback) → abre `EventDetails` se existir, senão `Events`
  4. Carrossel “Próximos eventos” (até 3) → abre `EventDetails`
- **Integrações**:
  - GET `/events/next`, GET `/members/me` (avatar), GET `/churches/:id`, GET `/events`.

---

### Agenda / eventos

#### `EventsScreen` (`src/screens/EventsScreen.tsx`)

- **Header**: `PageHeader` “Eventos e Cultos”, com `+` se `canManageEvents`.
- **Tabs (ordem)**: `Tabs` logo abaixo do header (`marginTop: 110`):
  - Próximos / Passados (filtra por `startDate >= now`)
- **Lista**: `FlatList` de cards; ao tocar → `EventDetails { id }`.
- **Regras de negócio**:
  - `canManageEvents` se role admin ou permissão `events_manage`.
  - FAB `+` também aparece para quem pode gerenciar.
- **Integração**: GET `/events`.

#### `AddEventScreen` (`src/screens/AddEventScreen.tsx`)

- **Layout**: `FormScreenLayout` + `FormsComponent`.
- **Campos (ordem)**:
  1. Título do evento * (`title`)
  2. Data do evento * (`startDate`, `date`)
  3. Horário (`time`, `HH:mm`)
  4. Descrição (`description`) — input maior quando `key === 'description'`
  5. Localização (`location`)
  6. Contribuição habilitada (`hasDonation`, toggle)
  7. Motivo da contribuição (`donationReason`, depende de `hasDonation`)
  8. Link do pagamento (`paymentLink`, depende de `hasDonation`)
  9. Banner do evento (`imageUrl`, image)
- **Regras de negócio**:
  - Requer `title` e `startDate`.
  - Converte `startDate` `dd/MM/yyyy` → `dd-MM-yyyy`.
  - Se `time` preenchido: combina para gerar `finalStartDate`.
  - Envia `endDate = startDate`.
- **Integração**: POST `/events`.

#### `EventDetailsScreen` (`src/screens/EventDetailsScreen.tsx`)

- **Layout**: `DetailScreenLayout` (com `imageUrl` do evento).
- **Ações**:
  - Ícone “editar” no header se `events_manage` (ou admin) → `EditEventScreen { id }`.
  - Se `event.hasDonation`: card “Contribuição” com botão “Abrir link de contribuição”.
- **Regras de negócio**:
  - Abre `Linking.openURL(event.donationLink)` com fallback de erro via Toast.
- **Integração**: GET `/events/:id`.

#### `EditEventScreen` (`src/screens/EditEventScreen.tsx`)

- **Layout**: `FormScreenLayout` + `FormsComponent`.
- **Campos (ordem)**: igual ao Add, com `donationLink` (nome diferente do Add) e preenchimento inicial via GET.
- **Regras de negócio**:
  - Requer `title` e `startDate`.
  - Mesma conversão/combinação de data/hora e `endDate = startDate`.
- **Integrações**:
  - GET `/events/:id`
  - PUT `/events/:id`

---

### Avisos

#### `NoticesScreen` (`src/screens/NoticesScreen.tsx`)

- **Header**: `PageHeader` “Avisos e Comunicados”, com `+` se `notice_manage`.
- **Tabs (ordem)**: `Não Lidos` (com badge) / `Lidos`.
- **Lista**: cards; tocar em um não-lido chama `markAsRead`.
- **Regras de negócio**:
  - `canManageNotices` via `hasAccess(user, 'notice_manage')`.
- **Integrações**:
  - GET `/notices`
  - POST `/notices/:id/read`

#### `AddNoticeScreen` (`src/screens/AddNoticeScreen.tsx`)

- **Layout**: `FormScreenLayout`.
- **Campos (ordem)**:
  1. Título *
  2. Mensagem * (textarea)
- **Regras de negócio**:
  - `title` e `message` obrigatórios (trim).
- **Integração**: POST `/notices`.

---

### Devocionais

#### `DevotionalsScreen` (`src/screens/DevotionalsScreen.tsx`)

- **Header**: implementação própria (barra azul com ícone bíblia e título).
- **Lista**: `FlatList` com `DevotionalCard` (card é responsável por render/ações).
- **Ação**: FAB “Adicionar” se `devotional_manage` (ou admin) → `AddDevotional`.
- **Integração**: GET `/devotionals`.

#### `DevotionalDetailScreen` (`src/screens/DevotionalDetailScreen.tsx`)

- **Layout**: imagem de topo (`ImageBackground`) + card branco sobreposto.
- **Seções (ordem)**:
  1. Título
  2. Data formatada
  3. Autor
  4. Versículo (com `BibleText`)
  5. Conteúdo
  6. Ação: Compartilhar (`Share.share`)
- **Observação**: recebe `devotional` via `route.params`.

#### `AddDevotionalScreen` (`src/screens/AddDevotionalScreen.tsx`)

- **Campos (ordem)**:
  1. Título *
  2. Livro * (picker)
  3. Capítulo * (numérico)
  4. Versículo * (numérico)
  5. Conteúdo (textarea)
  6. Data (picker) — **UI presente**, mas o POST atual não envia `date`
- **Regras de negócio**:
  - Requer `title`, `selectedBook`, `chapter`, `verse`.
  - Monta `passage = "${book} ${chapter}:${verse}"`.
- **Integração**: POST `/devotionals`.

---

### Contribuições

#### `ContributionsScreen` (`src/screens/ContributionsScreen.tsx`)

- **Header**: implementação própria (barra azul “Contribuir”).
- **Lista**: campanhas ativas (filtra `isActive`).
- **CTA**: botão “Contribuir” abre detalhes → `ContributionDetail` (passa objeto `contribution`).
- **Ação admin**: FAB “Adicionar” se `contributions_manage` (ou admin) → `AddContributions`.
- **Integração**: GET `/contributions`.

#### `AddContributionsScreen` (`src/screens/AddContributionsScreen.tsx`)

- **Campos (ordem)**:
  1. Título *
  2. Descrição (textarea)
  3. Meta de arrecadação (numérico; > 0)
  4. Data de término (opcional) — date picker modal
  5. Formas de pagamento:
     - lista de métodos adicionados
     - botão “+ Adicionar Forma de Pagamento” abre modal
  6. Campanha Ativa (switch)
  7. Ações: Cancelar / Criar Campanha
- **Regras de negócio**:
  - Título obrigatório.
  - `goal` se informado deve ser número > 0.
  - `endDate` enviado como ISO.
  - Métodos de pagamento:
    - `PIX` exige `chave`
    - `CONTA_BR` exige `banco`, `agencia`, `conta`
    - `IBAN` exige `iban`
- **Integração**: POST `/contributions`.

#### `ContributionDetailScreen` (`src/screens/ContributionDetailScreen.tsx`)

- **Entrada**: recebe `contribution` via `route.params`.
- **Seções (ordem)**:
  1. Título/descrição
  2. Stats: Meta / Arrecadado
  3. Data de término (se existir)
  4. Formas de pagamento (cards por método), com suporte a `qrCodeUrl` (abre via `Linking`)

---

### Finanças

#### `FinancesScreen` (`src/screens/FinancesScreen.tsx`)

- **Proteção**: envolve com `<Protected permission="finances_manage" />`.
- **Header**: `PageHeader` “Finanças” com botão `+` → `AddTransaction`.
- **Seções (ordem)**:
  1. Card “Resumo Financeiro” (saldo, entradas, saídas)
  2. Gráfico (PieChart) se houver dados
  3. Filtros: busca por título + filtro por tipo (Todas/Entradas/Saídas)
  4. Lista de transações (FlatList sem scroll interno) → `TransactionDetails { id }`
- **Integração**: GET `/finances`.

#### `AddTransactionScreen` (`src/screens/AddTransactionScreen.tsx`)

- **Campos (ordem)**:
  1. Título *
  2. Valor *
  3. Tipo *: Entrada | Saída (botões)
  4. Se Entrada:
     - Tipo de Entrada *: Ofertas | Dízimo | Contribuição (ModalSelector)
     - Se Contribuição: escolher campanha * + identificar contribuinte (membro via `MemberSearch` ou nome livre)
     - Se Dízimo: identificar dizimista (membro obrigatório via `MemberSearch` OU nome obrigatório)
  5. Se Saída:
     - Tipo de Saída *: Aluguel | Energia | Água | Internet | Outros
     - Se Outros: Descrição *
  6. Categoria (opcional)
  7. CTA: “Salvar Transação”
- **Regras de negócio**:
  - Título e valor obrigatórios.
  - Entrada exige `entryType`; Saída exige `exitType`.
  - `OUTROS` exige `exitTypeOther`.
  - Dízimo exige identificação do dizimista conforme switch.
  - Contribuição exige `contributionId`.
- **Integração**: POST `/finances`.

#### `TransactionDetailsScreen` (`src/screens/TransactionDetailsScreen.tsx`)

- **Header próprio** (não usa `PageHeader`): back + título + editar.
- **Seções (ordem)**:
  1. Título, Valor, Tipo, Categoria
  2. Detalhes por tipo (entrada/saída)
  3. Datas (criação/atualização) + criado por (se existir)
- **Ação**: editar → `EditTransaction { id }`.
- **Integração**: GET `/finances/:id`.

#### `EditTransactionScreen` (`src/screens/EditTransactionScreen.tsx`)

- **Objetivo**: editar transação existente.
- **Campos**: mesmos do Add, mas com preenchimento inicial via GET.
- **Integrações**:
  - GET `/finances/:id`
  - PUT `/finances/:id`

---

### Membros e permissões

#### `MembersListScreen` (`src/screens/MembersListScreen.tsx`)

- **Header**: `PageHeader` “Membros” com `+` → `MemberRegistrationScreen`.
- **Topo do conteúdo (ordem)**:
  1. Botão “Links de Convite” → `InviteLinks`
  2. Input de busca (filtra por nome)
  3. Lista de membros → `MemberDetails { id }`
- **Integração**: GET `/members`.

#### `MemberDetailsScreen` (`src/screens/MemberDetailsScreen.tsx`)

- **Layout**: `DetailScreenLayout`.
- **Seções (ordem)**:
  1. Avatar + nome + badge de role
  2. Card de informações:
     - Email/Telefone/Endereço (somente se `members_manage`)
     - Data de nascimento (sempre que existir)
- **Ação**: ícone no header (shield) navega para `Permissions` se `MANAGE_PERMISSIONS` ou `ADMINGERAL`.
- **Integração**: GET `/members/:id`.

#### `MemberRegistrationScreen` (`src/screens/MemberRegistrationScreen.tsx`)

- **Layout**: `FormScreenLayout` + `FormsComponent`.
- **Campos (ordem)**:
  1. Nome completo *
  2. E-mail *
  3. Telefone
  4. Data de nascimento
  5. Tipo de membro (select; options de `/register/types`)
  6. Senha * (mín. 6)
  7. Foto de Perfil (image)
- **Regras de negócio**:
  - `branchId` vem de `route.params.branchId` ou `currentUser.branchId`.
  - Requer nome/email/senha e senha >= 6.
- **Integrações**:
  - GET `/register/types` (popular select)
  - POST `/register` (criar membro)

#### `PermissionsScreen` (`src/screens/PermissionsScreen.tsx`)

- **Objetivo**: gerenciar role e permissões de membros (UI completa).
- **Seções (ordem)**:
  1. Busca por nome
  2. Lista de membros (seleciona o membro)
  3. Detalhe do membro selecionado:
     - Role (Picker) se usuário pode trocar role
     - Badges de permissões ativas
     - Lista de todas as permissões (Switch)
- **Regras de negócio (principais)**:
  - `ADMINGERAL` do alvo: não permite remover permissões (todas são efetivas).
  - Algumas permissões exigem role >= `COORDINATOR`:
    - `finances_manage`, `church_manage`, `contributions_manage`, `members_manage`
  - Troca de role pode remover permissões incompatíveis (avisa via Toast).
- **Integrações**:
  - GET `/members`
  - GET `/members/:id`
  - PATCH `/members/:id/role`
  - POST `/permissions/:memberId` (atualiza permissões)

#### `ManagePermissionsScreen` (`src/screens/ManagePermissionsScreen.tsx`)

- Lista simples de membros → navega para `EditMemberPermissions`.
- Integração: GET `/members`.

#### `EditMemberPermissionsScreen` (`src/screens/EditMemberPermissionsScreen.tsx`)

- UI “antiga”/alternativa para permissões por switches.
- **Regra**: permissões restritas (`finances_manage`, `church_manage`, `contributions_manage`) não podem ser ativadas se `role === MEMBER`.
- Integrações:
  - GET `/members/:id`
  - POST `/permissions/:memberId`

#### `PositionsScreen` (`src/screens/PositionsScreen.tsx`)

- **Objetivo**: listar/gerenciar cargos da igreja.
- **Regras**:
  - Somente `ADMINGERAL` pode criar/editar/deletar.
  - Cargos `isDefault` não exibem ações de edição/remoção.
- **Campos (criação)**:
  1. Nome do Cargo (input)
  2. Botão “Criar Cargo”
- Integrações:
  - GET `/positions`
  - POST `/positions`
  - PUT `/positions/:id`
  - DELETE `/positions/:id`

---

### Igreja e horários de culto

#### `ChurchSettingsScreen` (`src/screens/ChurchSettingsScreen.tsx`)

- **Proteção**: exige `church_manage` (senão mostra Toast e `goBack()`).
- **Seções (ordem)**:
  1. Informações da igreja
     - Avatar da igreja (upload/remoção)
     - Nome da igreja
     - URL do logo (texto)
     - CTA “Salvar Alterações”
  2. Horários de culto
     - Botão `+` → `ServiceScheduleForm`
     - Cards com ações:
       - Definir padrão
       - Criar eventos a partir do horário
       - Editar
       - Deletar (com confirmação e lógica de eventos relacionados)
- **Regras de negócio (horários)**:
  - Ao deletar:
    - consulta `getRelatedEventsCount`
    - se `count > 0`, pergunta se apaga eventos também
  - Auto-criar eventos: mostra info “Auto-criar eventos (N dias)”.
- **Integrações**:
  - GET `/churches` (encontra igreja pela `branchId`)
  - PUT `/churches/:id`
  - Upload avatar: POST `/upload/church-avatar` (multipart)
  - Horários: `serviceScheduleApi.*` (ver `src/api/serviceScheduleApi.ts`)

#### `ServiceScheduleFormScreen` (`src/screens/ServiceScheduleFormScreen.tsx`)

- **Objetivo**: criar/editar horário de culto.
- **Campos (ordem)**:
  1. Dia da semana * (Picker)
  2. Horário * (`HH:mm`)
  3. Título * (“Culto Dominical”)
  4. Descrição (textarea)
  5. Localização
  6. “Definir como horário padrão” (switch)
  7. “Criar eventos automaticamente” (switch)
  8. Se auto-criar: “Dias à frente…” (numérico)
  9. Botão Criar/Atualizar
- **Regras de negócio**:
  - Título obrigatório.
  - Requer `user.branchId`.
  - Ao atualizar: pode retornar `updatedEventsCount` e mostra Toast informativo.
- **Integrações**:
  - POST `/service-schedules`
  - PUT `/service-schedules/:id`

---

### Assinaturas/planos

#### `SubscriptionScreen` (`src/screens/SubscriptionScreen.tsx`)

- **Objetivo**: exibir e gerenciar assinatura do usuário.
- **Estados**:
  - Loading
  - Sem assinatura (404) → card “Nenhuma assinatura ativa”
  - Com assinatura:
    - Status card (pending/active/past_due/canceled/unpaid/trialing)
    - Plano + período + próxima cobrança
    - Histórico de pagamentos
- **Ações**:
  - Cancelar (alert → `subscriptionApi.cancel(true)`)
  - Retomar (quando cancelada) → `subscriptionApi.resume()`
- **Integrações**:
  - GET `/api/subscriptions`
  - POST `/api/subscriptions/cancel`
  - POST `/api/subscriptions/resume`

#### `SubscriptionSuccessScreen` (`src/screens/SubscriptionSuccessScreen.tsx`)

- **Objetivo**: confirmar criação/estado da assinatura.
- **Regra**: após carregar, redireciona para `Dashboard` em 5s.
- Integração: GET `/api/subscriptions`.

---

### Perfil

#### `ProfileScreen` (`src/screens/ProfileScreen.tsx`)

- **Layout**: `DetailScreenLayout`, com botão de configurações no header (somente no próprio perfil).
- **Seções (ordem)**:
  1. Avatar + nome + email
  2. Dados: email/telefone/endereço/data nascimento/congregação/cargo/nível de acesso
  3. Permissões (se `canManagePermissions` ou `isOwnProfile`)
  4. CTA “Gerenciar Permissões” (se `canManagePermissions`) → `Permissions`
- **Integrações**:
  - GET `/members/me` (próprio)
  - GET `/members/:id` (perfil de outro)

#### `EditProfileScreen` (`src/screens/EditProfileScreen.tsx`)

- **Objetivo**: editar dados do próprio perfil.
- **Campos (ordem)**:
  1. Avatar (upload/remoção; máx 5MB) — POST `/upload/avatar`
  2. Nome * (com validação)
  3. Email (desabilitado; não editável)
  4. Telefone
  5. Endereço
  6. Data de nascimento (input com máscara `dd/mm/yyyy` + validação)
  7. Cargo (Picker desabilitado; informativo)
  8. Botão “Salvar Alterações”
- **Regras de negócio**:
  - Nome obrigatório.
  - Data de nascimento: aceita vazio; se preenchida precisa ser `dd/mm/yyyy` e valores plausíveis.
  - Não permite alterar email e cargo pelo próprio usuário.
  - Se avatar removido: envia `avatarUrl: null`.
- **Integrações**:
  - GET `/positions` (somente para exibir cargo)
  - GET `/members/me`
  - PUT `/members/:id`
  - POST `/upload/avatar`

---

### Mais (menu)

#### `MoreScreen` (`src/screens/MoreScreen.tsx`)

- **Header**: `PageHeader title="Mais"`.
- **Seções (ordem)**:
  1. Opções gerais (Meu Perfil, Devocionais, Minha Assinatura, etc.)
  2. “Para líderes e administradores” (filtrado por permissões/role)
  3. “Sair da conta” → navega para `Login` (obs.: não chama `logout()` do store aqui)
- **Regra de visibilidade**:
  - `hasPermission` permite por role (`ADMINGERAL`, `ADMINFILIAL`) ou `hasAccess()` ou lista de permissões do token.

---

## Observações importantes (estado atual)

- Existem telas com **header próprio** (ex.: `ContributionsScreen`, `DevotionalsScreen`, `TransactionDetailsScreen`) que não seguem `PageHeader`.
- O nome da permissão para avisos está como `notice_manage` na UI; confira se o backend usa esse mesmo `type`.
- `AddDevotionalScreen` possui campo de “Data” na UI, mas não envia no POST atualmente.
- `MoreScreen` navega para `Login` para “sair”, mas não executa `useAuthStore.getState().logout()` (o token pode permanecer no storage).


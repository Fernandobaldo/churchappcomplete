# Backend — API HTTP pública

O backend é um servidor **Fastify**. As rotas são registradas em `backend/src/routes/registerRoutes.ts` e o Swagger é servido em `GET /docs` (ver `backend/src/server.ts`).

## Base URL e Swagger

- **Base URL (dev)**: `http://localhost:3333`
- **Swagger UI**: `GET /docs`
- **Healthcheck**: `GET /health`

> Observação: alguns endpoints existem por compatibilidade entre web e mobile (ex.: `/auth/me` e `/members/me`).

## Autenticação

A maioria das rotas é protegida por JWT:

- Header:

```bash
Authorization: Bearer <token>
```

### Login

- **POST `/auth/login`**
  - Body: `{ "email": "…", "password": "…" }`
  - Retorna: `{ token, user, type }` (onde `type` é `'user' | 'member'`)

Exemplo:

```bash
curl -sS -X POST "http://localhost:3333/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha"}'
```

### Perfil do usuário autenticado

- **GET `/auth/me`** (compatibilidade mobile; registrado em `backend/src/routes/auth/index.ts`)
- **GET `/members/me`** (perfil do membro; registrado em `backend/src/routes/membersRoutes.ts`)

## Padrões de erro (na prática)

O backend não padroniza 100% dos formatos de erro entre todos os módulos. Você verá principalmente:

- `{ "message": "…" }` (muito comum em rotas)
- `{ "error": "…" }` e/ou `{ "details": … }` (algumas rotas com Zod/validação)

Para o schema exato por rota, use o Swagger em `GET /docs`.

---

## Catálogo de endpoints (por módulo)

### Health

- **GET `/health`**

### Autenticação e permissões

Rotas registradas com prefixo:

- `app.register(authRoutes, { prefix: '/auth' })`
- `app.register(permissionsRoutes, { prefix: '/permissions' })`
- `app.register(registerRoute, { prefix: '/register' })`
- `app.register(publicRegisterRoute, { prefix: '/public' })`

Endpoints:

- **POST `/auth/login`**
- **GET `/auth/me`**
- **GET `/permissions/all`**
- **POST `/permissions/:id`** (atribuir permissões a um membro)
- **POST `/register/`** (registro “interno” ou “landing page”; ver `fromLandingPage`)
- **GET `/register/types`** (roles disponíveis)
- **POST `/public/register`** (registro público “landing page”)
- **POST `/public/register/invite`** (registro via link de convite)

### Filiais (Branches)

Prefixo: `/branches` (ver `backend/src/routes/branchRoutes.ts`)

- **POST `/branches/`**
- **GET `/branches/`**
- **DELETE `/branches/:id`**

### Igrejas (Churches)

Prefixo: `/churches` (ver `backend/src/routes/churchRoutes.ts`)

- **POST `/churches/`**
- **GET `/churches/`**
- **GET `/churches/:id`**
- **PUT `/churches/:id`**
- **DELETE `/churches/:id`**
- **PATCH `/churches/:id/deactivate`**

### Membros (Members)

Prefixo: `/members` (ver `backend/src/routes/membersRoutes.ts`)

- **GET `/members/`**
- **GET `/members/me`**
- **GET `/members/:id`**
- **PUT `/members/:id`**
- **PATCH `/members/:id/role`**

### Eventos (Events)

Prefixo: `/events` (ver `backend/src/routes/eventsRoutes.ts`)

- **GET `/events/`**
- **GET `/events/next`**
- **GET `/events/:id`**
- **POST `/events/`**
- **PUT `/events/:id`**
- **DELETE `/events/:id`**

Exemplo (criar evento; datas aceitam ISO ou `dd/MM/yyyy`):

```bash
curl -sS -X POST "http://localhost:3333/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Culto da Família",
    "startDate": "2026-01-10T19:00:00.000Z",
    "endDate": "2026-01-10T21:00:00.000Z",
    "time": "19:00",
    "location": "Templo",
    "description": "Traga sua família!"
  }'
```

### Devocionais (Devotionals)

Prefixo: `/devotionals` (ver `backend/src/routes/devotionalsRoutes.ts`)

- **GET `/devotionals/`**
- **GET `/devotionals/:id`**
- **POST `/devotionals/`** (requer `devotional_manage`)
- **POST `/devotionals/:id/like`**
- **DELETE `/devotionals/:id/unlike`**
- **PUT `/devotionals/:id`** (requer `devotional_manage`)
- **DELETE `/devotionals/:id`** (requer `devotional_manage`)

### Contribuições (Contributions)

Prefixo: `/contributions` (ver `backend/src/routes/contributionsRoutes.ts`)

- **GET `/contributions/`**
- **GET `/contributions/:id`**
- **POST `/contributions/`** (requer `contributions_manage`)
- **PATCH `/contributions/:id/toggle-active`** (requer `contributions_manage`)

### Avisos (Notices)

Prefixo: `/notices` (ver `backend/src/routes/noticesRoutes.ts`)

- **GET `/notices/`**
- **POST `/notices/`**
- **POST `/notices/:id/read`**

### Finanças (Finances)

Prefixo: `/finances` (ver `backend/src/routes/financesRoutes.ts`)

- **GET `/finances/`** (query: `startDate`, `endDate`, `category`, `type`, `search`)
- **GET `/finances/:id`**
- **POST `/finances/`** (requer `finances_manage`)
- **PUT `/finances/:id`** (requer `finances_manage`)
- **DELETE `/finances/:id`** (requer `finances_manage`)

### Horários de culto (Service Schedules)

Prefixo: `/service-schedules` (ver `backend/src/routes/serviceScheduleRoutes.ts`)

- **POST `/service-schedules/`** (requer `church_manage`)
- **GET `/service-schedules/branch/:branchId`**
- **GET `/service-schedules/:id`**
- **PUT `/service-schedules/:id`** (requer `church_manage`)
- **GET `/service-schedules/:id/related-events-count`**
- **DELETE `/service-schedules/:id`**
- **PATCH `/service-schedules/:id/set-default`**
- **POST `/service-schedules/:id/create-events`** (requer `church_manage` + `events_manage`)

### Links de convite (Invite Links)

Sem prefixo adicional (ver `backend/src/routes/inviteLinkRoutes.ts`):

- **POST `/invite-links`** (autenticado)
- **GET `/invite-links/branch/:branchId`** (autenticado)
- **PATCH `/invite-links/:id/deactivate`** (autenticado)
- **GET `/invite-links/:token/qrcode`** (público; retorna binário PNG)
- **GET `/invite-links/:token/pdf`** (público; retorna binário PDF)
- **GET `/invite-links/:token/info`** (público; metadados para tela de registro)

### Upload

Sem prefixo adicional (ver `backend/src/routes/uploadRoutes.ts`):

- **POST `/upload/avatar`** (multipart)
- **POST `/upload/church-avatar`** (multipart)
- **POST `/upload/event-image`** (multipart)

Arquivos servidos em: **`/uploads/<arquivo>`** (static em `backend/src/server.ts`).

Exemplo (upload de avatar):

```bash
curl -sS -X POST "http://localhost:3333/upload/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/avatar.png"
```

### Cargos (Positions)

Sem prefixo adicional (ver `backend/src/routes/positionRoutes.ts`):

- **GET `/positions`**
- **POST `/positions`**
- **PUT `/positions/:id`**
- **DELETE `/positions/:id`**

### Planos (Plans)

Prefixo: `/plans` (ver `backend/src/routes/planRoutes.ts`)

- **GET `/plans/`** (público)
- **POST `/plans/`** (autenticado; `SAAS_ADMIN`)

### Assinaturas (Subscriptions “core”)

Prefixo: `/subscriptions` (ver `backend/src/routes/subscriptionRoutes.ts`)

- **GET `/subscriptions/me`**
- **GET `/subscriptions/current`** (alias)
- **POST `/subscriptions/change`**
- **GET `/subscriptions/`** (admin; `SAAS_ADMIN`)

### Pagamentos / Gateway (Subscriptions via `/api`)

Prefixo: `/api` (ver `backend/src/routes/paymentRoutes.ts`)

- **POST `/api/subscriptions/checkout`**
- **GET `/api/subscriptions`**
- **POST `/api/subscriptions/cancel`**
- **POST `/api/subscriptions/resume`**
- **POST `/api/webhooks/payment/:provider`** (público; webhook)

### Admin (SaaS)

Rotas “admin” são separadas por autenticação própria (token de admin) e usam prefixo explícito `/admin/...` (ver `backend/src/routes/adminRoutes.ts` e `backend/src/routes/adminAuthRoutes.ts`).

Autenticação:

- **POST `/admin/auth/login`**
- **POST `/admin/auth/logout`**
- **GET `/admin/auth/me`**

Rotas principais:

- Dashboard: **GET `/admin/dashboard/stats`**
- Users: **GET `/admin/users`**, **GET `/admin/users/:id`**, **PATCH `/admin/users/:id/block`**, **PATCH `/admin/users/:id/unblock`**, **POST `/admin/users/:id/reset-password`**, **POST `/admin/users/:id/impersonate`**
- Churches: **GET `/admin/churches`**, **GET `/admin/churches/:id`**, **GET `/admin/churches/:id/branches`**, **GET `/admin/churches/:id/members`**, **PATCH `/admin/churches/:id/suspend`**, **PATCH `/admin/churches/:id/reactivate`**, **PATCH `/admin/churches/:id/plan`**, **POST `/admin/churches/:id/impersonate`**
- Members: **GET `/admin/members`**, **GET `/admin/members/:id`**
- Plans: **GET `/admin/plans`**, **GET `/admin/plans/:id`**, **POST `/admin/plans`**, **PATCH `/admin/plans/:id`**, **PATCH `/admin/plans/:id/activate`**, **PATCH `/admin/plans/:id/deactivate`**
- Subscriptions: **GET `/admin/subscriptions`**, **GET `/admin/subscriptions/:id`**, **GET `/admin/subscriptions/:id/history`**, **PATCH `/admin/subscriptions/:id/plan`**, **PATCH `/admin/subscriptions/:id/status`**, **PATCH `/admin/subscriptions/:id/cancel`**, **PATCH `/admin/subscriptions/:id/reactivate`**
- Config: **GET `/admin/config`**, **PATCH `/admin/config`**
- Audit: **GET `/admin/audit`**


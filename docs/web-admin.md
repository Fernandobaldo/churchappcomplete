# Web Admin (Vite/React) — APIs, store, utilitários e componentes

O `web-admin` é a interface administrativa do SaaS (roles: `SUPERADMIN`, `SUPPORT`, `FINANCE`). Ela usa endpoints `/admin/*` do backend e um **token JWT de admin** (diferente do token do usuário “comum”).

Arquivos principais:

- `web-admin/src/api/adminApi.ts`
- `web-admin/src/stores/adminAuthStore.ts`
- `web-admin/src/utils/permissions.ts`
- `web-admin/src/components/*`

## Cliente HTTP e módulos de API (`web-admin/src/api/adminApi.ts`)

### Base URL

- `import.meta.env.VITE_API_URL` (prioridade)
- fallback: `http://localhost:3333`

### Interceptors

- Injeta `Authorization: Bearer <token>` a partir de `useAdminAuthStore`.
- Em `401`, executa `logout()` e redireciona para `/admin/login`.

### Exportações públicas

- `default export adminApi` (axios)
- `adminAuthApi`:
  - `login(email, password)` → `POST /admin/auth/login`
  - `logout()` → `POST /admin/auth/logout`
  - `getMe()` → `GET /admin/auth/me`
- `dashboardApi.getStats()` → `GET /admin/dashboard/stats`
- `usersApi`:
  - `getAll(params?)` → `GET /admin/users`
  - `getById(id)` → `GET /admin/users/:id`
  - `block(id)` → `PATCH /admin/users/:id/block`
  - `unblock(id)` → `PATCH /admin/users/:id/unblock`
  - `resetPassword(id)` → `POST /admin/users/:id/reset-password`
  - `impersonate(id)` → `POST /admin/users/:id/impersonate`
- `churchesApi`:
  - `getAll(params?)` → `GET /admin/churches`
  - `getById(id)` → `GET /admin/churches/:id`
  - `getBranches(id)` → `GET /admin/churches/:id/branches`
  - `getMembers(id, params?)` → `GET /admin/churches/:id/members`
  - `suspend(id)` → `PATCH /admin/churches/:id/suspend`
  - `reactivate(id)` → `PATCH /admin/churches/:id/reactivate`
  - `changePlan(id, planId)` → `PATCH /admin/churches/:id/plan`
  - `impersonateOwner(id)` → `POST /admin/churches/:id/impersonate`
- `membersApi`:
  - `getAll(params?)` → `GET /admin/members`
  - `getById(id)` → `GET /admin/members/:id`
- `plansApi`:
  - `getAll()` → `GET /admin/plans`
  - `getById(id)` → `GET /admin/plans/:id`
  - `create(data)` → `POST /admin/plans`
  - `update(id, data)` → `PATCH /admin/plans/:id`
  - `activate(id)` → `PATCH /admin/plans/:id/activate`
  - `deactivate(id)` → `PATCH /admin/plans/:id/deactivate`
- `subscriptionsApi`:
  - `getAll(params?)` → `GET /admin/subscriptions`
  - `getById(id)` → `GET /admin/subscriptions/:id`
  - `getHistory(id)` → `GET /admin/subscriptions/:id/history`
  - `changePlan(id, planId)` → `PATCH /admin/subscriptions/:id/plan`
  - `updateStatus(id, status)` → `PATCH /admin/subscriptions/:id/status`
  - `cancel(id)` → `PATCH /admin/subscriptions/:id/cancel`
  - `reactivate(id)` → `PATCH /admin/subscriptions/:id/reactivate`
- `auditApi.getLogs(params?)` → `GET /admin/audit`
- `configApi`:
  - `get()` → `GET /admin/config`
  - `update(config)` → `PATCH /admin/config`

Exemplo:

```ts
import { adminAuthApi, dashboardApi } from '../api/adminApi'
import { useAdminAuthStore } from '../stores/adminAuthStore'

async function loginAdmin(email: string, password: string) {
  const { token, admin } = await adminAuthApi.login(email, password)
  useAdminAuthStore.getState().login(token, admin)
}

async function carregarStats() {
  return dashboardApi.getStats()
}
```

## Store de autenticação (`web-admin/src/stores/adminAuthStore.ts`)

`useAdminAuthStore` (Zustand + persist em `localStorage`) oferece:

- **State**
  - `adminUser: AdminUser | null`
  - `token: string | null`
  - `isAuthenticated: boolean`
- **Actions**
  - `setAdminUserFromToken(token, admin)`
  - `login(token, admin)` (também grava `admin_token` no localStorage)
  - `logout()`
  - `checkAuth()` (valida expiração e se `decoded.type === 'admin'`)

## Utilitários de permissões por role (`web-admin/src/utils/permissions.ts`)

Funções públicas:

- `canBlockUser(role)` (somente `SUPERADMIN`)
- `canSuspendChurch(role)` (somente `SUPERADMIN`)
- `canChangePlan(role)` (`SUPERADMIN` ou `FINANCE`)
- `canImpersonate(role)` (`SUPERADMIN` ou `SUPPORT`)
- `canAccessConfig(role)` (somente `SUPERADMIN`)
- `canAccessAudit(role)` (somente `SUPERADMIN`)
- `canManagePlans(role)` (somente `SUPERADMIN`)
- `canViewUsers(role)` (`SUPERADMIN` ou `SUPPORT`)
- `canViewChurches(role)` (`SUPERADMIN` ou `SUPPORT`)
- `canViewSubscriptions(role)` (`SUPERADMIN` ou `FINANCE`)
- `canViewMembers(role)` (`SUPERADMIN` ou `SUPPORT`)

## Componentes principais (`web-admin/src/components`)

### `AdminProtectedRoute`

- Arquivo: `web-admin/src/components/AdminProtectedRoute.tsx`
- Props:
  - `children: React.ReactNode`
  - `allowedRoles?: AdminRole[]`
- Comportamento:
  - se não autenticado → `/admin/login`
  - se `allowedRoles` não inclui o role → `/admin/forbidden`

### `PermissionGuard`

- Arquivo: `web-admin/src/components/PermissionGuard.tsx`
- Props:
  - `children: React.ReactNode`
  - `allowedRoles: AdminRole[]`
  - `fallback?: React.ReactNode`

### `DataTable`

- Arquivo: `web-admin/src/components/DataTable.tsx`
- Genérico `T extends { id: string }`
- Props:
  - `data: T[]`
  - `columns: { header; accessor; className? }[]`
  - `loading?: boolean`
  - `pagination?: { page; limit; total; totalPages; onPageChange }`
  - `onRowClick?: (row: T) => void`

### `ConfirmModal`

- Arquivo: `web-admin/src/components/ConfirmModal.tsx`
- Props:
  - `isOpen: boolean`
  - `onClose(): void`
  - `onConfirm(): void`
  - `title: string`
  - `message: string`
  - `confirmText?: string` (default `Confirmar`)
  - `cancelText?: string` (default `Cancelar`)
  - `variant?: 'danger' | 'warning' | 'info'` (default `warning`)
  - `loading?: boolean`

### `StatusBadge`

- Arquivo: `web-admin/src/components/StatusBadge.tsx`
- Props:
  - `status: string`
  - `variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'`

### `SubscriptionCard`

- Arquivo: `web-admin/src/components/SubscriptionCard.tsx`
- Props:
  - `subscription: Subscription`
  - `onClick?: () => void`
- Responsabilidade: card de assinatura com status e datas (usa `date-fns` + `ptBR`).

### `AdminLayout`

- Arquivo: `web-admin/src/components/AdminLayout.tsx`
- Props:
  - `children: ReactNode`
- Responsabilidade: layout base com `AdminSidebar` + `AdminHeader`.


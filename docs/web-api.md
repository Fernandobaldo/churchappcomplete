# Web (Vite/React) — APIs públicas e utilitários

Esta seção documenta o que a camada web expõe como “API” (módulos que outros arquivos importam diretamente): cliente HTTP, módulos de API, store de autenticação e utilitários de autorização.

Arquivos principais:

- `web/src/api/api.ts`
- `web/src/api/serviceScheduleApi.ts`
- `web/src/stores/authStore.ts`
- `web/src/utils/authUtils.ts`

## Cliente HTTP (`web/src/api/api.ts`)

### Base URL

`baseURL` é definido por:

- **1º**: `import.meta.env.VITE_API_URL`
- **fallback**: `http://localhost:3333`

### Interceptors

- **Request**: injeta `Authorization: Bearer <token>` se existir token em `useAuthStore`.
- **Response**:
  - normaliza `response.data` via `JSON.parse(JSON.stringify(...))`
  - em `401`, executa `logout()` e redireciona para `/login`

### Exportações públicas

- `default export api` (instância axios)
- `setToken(token: string)`
- `removeToken()`
- `plansApi.getAll()`: `GET /plans`
- `subscriptionApi`:
  - `checkout(planId: string, trialDays?: number)`: `POST /api/subscriptions/checkout`
  - `getMySubscription()`: `GET /api/subscriptions`
  - `cancel(cancelAtPeriodEnd = true)`: `POST /api/subscriptions/cancel`
  - `resume()`: `POST /api/subscriptions/resume`

Exemplo de uso (após login):

```ts
import api, { plansApi, subscriptionApi, setToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'

async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  useAuthStore.getState().setUserFromToken(data.token)
  setToken(data.token)
}

async function carregarPlanos() {
  const planos = await plansApi.getAll()
  return planos
}

async function iniciarCheckout(planId: string) {
  const result = await subscriptionApi.checkout(planId, 7)
  return result
}
```

## Service Schedules (`web/src/api/serviceScheduleApi.ts`)

Esse módulo expõe:

- Tipos: `ServiceSchedule`, `CreateServiceScheduleData`, `UpdateServiceScheduleData`, `CreateEventsOptions`
- `serviceScheduleApi`:
  - `getByBranch(branchId)` → `GET /service-schedules/branch/:branchId`
  - `getById(id)` → `GET /service-schedules/:id`
  - `create(data)` → `POST /service-schedules`
  - `update(id, data)` → `PUT /service-schedules/:id`
  - `getRelatedEventsCount(id)` → `GET /service-schedules/:id/related-events-count`
  - `delete(id, deleteEvents=false)` → `DELETE /service-schedules/:id` (body: `{ deleteEvents }`)
  - `setDefault(id)` → `PATCH /service-schedules/:id/set-default`
  - `createEvents(id, options?)` → `POST /service-schedules/:id/create-events`

Exemplo:

```ts
import { serviceScheduleApi } from '../api/serviceScheduleApi'

async function criarHorario(branchId: string) {
  return serviceScheduleApi.create({
    branchId,
    dayOfWeek: 0,
    time: '19:00',
    title: 'Culto de Domingo',
    isDefault: true,
    autoCreateEvents: true,
    autoCreateDaysAhead: 30,
  })
}
```

## Store de autenticação (`web/src/stores/authStore.ts`)

`useAuthStore` (Zustand + persist em `localStorage`) fornece:

- **State**
  - `user: User | null`
  - `token: string | null`
- **Actions**
  - `setUserFromToken(token: string)`: decodifica JWT e popula `user`/`token`
  - `updateUser(updates: Partial<User>)`
  - `logout()`: zera `user` e `token`
  - `setToken(token: string)`

Uso comum:

```ts
import { useAuthStore } from '../stores/authStore'

const { user, token, logout, setUserFromToken } = useAuthStore()
```

## Utilitários de autorização (`web/src/utils/authUtils.ts`)

Funções públicas:

- `hasAccess(user, permission)`:
  - retorna `true` se `role` for `ADMINGERAL`/`ADMINFILIAL`, ou se `user.permissions` contiver `{ type: permission }`
- `hasAnyAccess(user, permissions: string[])`
- `hasAllAccess(user, permissions: string[])`
- `hasRole(user, role)`
- `hasAnyRole(user, roles: string[])`

Exemplo:

```ts
import { hasAccess } from '../utils/authUtils'
import { useAuthStore } from '../stores/authStore'

const user = useAuthStore.getState().user
const podeGerenciarEventos = hasAccess(user, 'events_manage')
```


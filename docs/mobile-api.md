# Mobile (Expo/React Native) — APIs públicas e utilitários

Arquivos principais:

- `mobile/src/api/api.ts`
- `mobile/src/api/serviceScheduleApi.ts`
- `mobile/src/stores/authStore.ts`

## Cliente HTTP (`mobile/src/api/api.ts`)

### Base URL (ordem de prioridade)

`baseURL` é definida por `getBaseURL()`:

1. `process.env.EXPO_PUBLIC_API_URL`
2. `Constants.expoConfig?.extra?.apiUrl` (via `app.config.js`)
3. Fallback por plataforma (dev):
   - Android emulator: `http://10.0.2.2:3333`
   - iOS / outras: `http://192.168.1.7:3333` (valor hardcoded no arquivo)

### Interceptors

- **Request**: injeta `Authorization` com token do `useAuthStore`.
- **Response**:
  - normaliza `response.data` (serializa/desserializa)
  - em `401`, executa `useAuthStore.getState().logout()`

### Exportações públicas

- `default export api` (axios)
- `setToken(token: string)`
- `removeToken()`
- `plansApi.getAll()` → `GET /plans`
- `subscriptionApi`:
  - `checkout(planId, trialDays?)` → `POST /api/subscriptions/checkout`
  - `getMySubscription()` → `GET /api/subscriptions`
  - `cancel(cancelAtPeriodEnd=true)` → `POST /api/subscriptions/cancel`
  - `resume()` → `POST /api/subscriptions/resume`

## Service Schedules (`mobile/src/api/serviceScheduleApi.ts`)

Mesma API do web:

- `serviceScheduleApi.getByBranch(branchId)` → `GET /service-schedules/branch/:branchId`
- `serviceScheduleApi.getById(id)` → `GET /service-schedules/:id`
- `serviceScheduleApi.create(data)` → `POST /service-schedules`
- `serviceScheduleApi.update(id, data)` → `PUT /service-schedules/:id`
- `serviceScheduleApi.getRelatedEventsCount(id)` → `GET /service-schedules/:id/related-events-count`
- `serviceScheduleApi.delete(id, deleteEvents=false)` → `DELETE /service-schedules/:id` (body: `{ deleteEvents }`)
- `serviceScheduleApi.setDefault(id)` → `PATCH /service-schedules/:id/set-default`
- `serviceScheduleApi.createEvents(id, options?)` → `POST /service-schedules/:id/create-events`

## Store de autenticação (`mobile/src/stores/authStore.ts`)

`useAuthStore` (Zustand + persist em `AsyncStorage`) fornece:

- **State**
  - `user: User | null`
  - `token: string | null`
- **Actions**
  - `setUserFromToken(token: string)`
  - `updateUser(updates: Partial<User>)`
  - `logout()`
  - `setToken(token: string)`

Observação:

- O shape do `DecodedToken` no mobile aceita `userId`, `memberId`, `churchId`, `permissions` etc., para compatibilidade com diferentes conteúdos do JWT.


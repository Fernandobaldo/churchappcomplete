# Services and Hooks — Guia Completo

## Services Layer

### Estrutura

Todos os services estão em `mobile/src/services/` e são exportados via `services/index.ts`.

### Services Disponíveis

#### auth.service.ts

```typescript
export const authService = {
  login: (email: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<User>
  getMe: () => Promise<User>
  refreshToken: (refreshToken: string) => Promise<TokenResponse>
}
```

**Uso:**
```tsx
import { authService } from '../services'

const handleLogin = async () => {
  try {
    const response = await authService.login(email, password)
    // ... salvar token, navegar, etc.
  } catch (error) {
    // ... tratar erro
  }
}
```

#### events.service.ts

```typescript
export const eventsService = {
  getAll: () => Promise<Event[]>
  getById: (id: string) => Promise<Event>
  getNext: () => Promise<Event | null>
  create: (payload: CreateEventPayload) => Promise<Event>
  update: (id: string, payload: UpdateEventPayload) => Promise<Event>
  delete: (id: string) => Promise<void>
}
```

**Uso:**
```tsx
import { eventsService } from '../services'

const fetchEvents = async () => {
  const events = await eventsService.getAll()
  setEvents(events)
}
```

#### members.service.ts

```typescript
export const membersService = {
  getAll: () => Promise<Member[]>
  getById: (id: string) => Promise<Member | null>
  search: (params: SearchMembersParams) => Promise<Member[]>
}
```

**Uso:**
```tsx
import { membersService } from '../services'

// Buscar todos
const members = await membersService.getAll()

// Buscar por ID
const member = await membersService.getById(id)

// Buscar com filtro
const results = await membersService.search({
  search: 'João',
  limit: 10
})
```

#### bible.service.ts

```typescript
export const bibleService = {
  getPassage: (
    passage: string,
    bookTranslation: Record<string, string>,
    version?: string
  ) => Promise<string>
}
```

**Uso:**
```tsx
import { bibleService } from '../services'
import { bookTranslation } from '../utils/translateBooks'

const text = await bibleService.getPassage('João 3:16', bookTranslation, 'nvi')
```

#### plans.service.ts

```typescript
export const plansService = {
  // ... métodos de planos
}
```

#### subscriptions.service.ts

```typescript
export const subscriptionsService = {
  // ... métodos de assinaturas
}
```

### Criando um Novo Service

**Template:**

```typescript
import api from '../api/api'

export interface MyEntity {
  id: string
  name: string
  // ... mais campos
}

export interface CreateMyEntityPayload {
  name: string
  // ... mais campos
}

export const myService = {
  /**
   * Get all entities
   */
  getAll: async (): Promise<MyEntity[]> => {
    const response = await api.get<MyEntity[]>('/my-entities')
    return response.data
  },

  /**
   * Get entity by ID
   */
  getById: async (id: string): Promise<MyEntity> => {
    const response = await api.get<MyEntity>(`/my-entities/${id}`)
    return response.data
  },

  /**
   * Create entity
   */
  create: async (payload: CreateMyEntityPayload): Promise<MyEntity> => {
    const response = await api.post<MyEntity>('/my-entities', payload)
    return response.data
  },

  /**
   * Update entity
   */
  update: async (id: string, payload: Partial<CreateMyEntityPayload>): Promise<MyEntity> => {
    const response = await api.put<MyEntity>(`/my-entities/${id}`, payload)
    return response.data
  },

  /**
   * Delete entity
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/my-entities/${id}`)
  },
}
```

**Adicionar ao index.ts:**

```typescript
export { myService } from './my.service'
export type { MyEntity, CreateMyEntityPayload } from './my.service'
```

## Hooks Customizados

### useAsyncState

**Localização:** `hooks/useAsyncState.ts`

**Uso:** Gerencia estado de operações assíncronas (loading, error, data).

```typescript
const { data, loading, error, execute, reset } = useAsyncState<Event[]>()

useEffect(() => {
  execute(async () => {
    return await eventsService.getAll()
  })
}, [execute])
```

**API:**
```typescript
{
  data: T | null
  loading: boolean
  error: string | null
  execute: (asyncFn: () => Promise<T>, options?: { silent?: boolean; onError?: (err: unknown) => string | null }) => Promise<T>
  reset: () => void
  setData: (value: T | null) => void
  setError: (value: string | null) => void
  setLoading: (value: boolean) => void
}
```

**Opções:**
- `silent: true`: Não seta loading state (útil para refresh em background)
- `onError`: Handler customizado de erro

### usePullToRefresh

**Localização:** `hooks/usePullToRefresh.ts`

**Uso:** Gerencia estado de pull-to-refresh.

```typescript
const { refreshing, onRefresh } = usePullToRefresh(fetchEvents)

<ViewScreenLayout
  refreshing={refreshing}
  onRefresh={onRefresh}
/>
```

**API:**
```typescript
{
  refreshing: boolean
  onRefresh: () => Promise<void>
  setRefreshing: (value: boolean) => void
}
```

### useDebounce

**Localização:** `hooks/useDebounce.ts`

**Uso:** Debounce de valores (útil para busca).

```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearchTerm.length >= 2) {
    searchAPI(debouncedSearchTerm)
  }
}, [debouncedSearchTerm])
```

**API:**
```typescript
useDebounce<T>(value: T, delay?: number): T
```

### useMembersSearch

**Localização:** `hooks/useMembersSearch.ts`

**Uso:** Busca de membros com debounce automático.

```typescript
const { members, loading, error } = useMembersSearch(searchTerm, {
  limit: 10,
  debounceMs: 300
})
```

**API:**
```typescript
{
  members: Member[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

### useBiblePassage

**Localização:** `hooks/useBiblePassage.ts`

**Uso:** Busca texto da Bíblia automaticamente.

```typescript
const { text, loading, error } = useBiblePassage('João 3:16', 'nvi')
```

**API:**
```typescript
{
  text: string | null
  loading: boolean
  error: string | null
}
```

### useMe

**Localização:** `hooks/useMe.ts`

**Uso:** Busca usuário autenticado atual.

```typescript
const { user, loading, error } = useMe()
```

**API:**
```typescript
{
  user: any | null
  loading: boolean
  error: string | null
}
```

### useNextEvent

**Localização:** `hooks/useNextEvent.ts`

**Uso:** Busca próximo evento.

```typescript
const { nextEvent, loading, error } = useNextEvent()
```

**API:**
```typescript
{
  nextEvent: Event | null
  loading: boolean
  error: string | null
}
```

### useBackToDashboard

**Localização:** `hooks/useBackToDashboard.ts`

**Uso:** Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior.

```typescript
export default function MyScreen() {
  useBackToDashboard()
  // ... resto do código
}
```

## Criando um Novo Hook

**Template:**

```typescript
import { useEffect } from 'react'
import { useAsyncState } from './useAsyncState'
import { myService } from '../services/my.service'

/**
 * Hook for fetching my entities
 * 
 * @param id Optional entity ID
 * @returns Object with entity, loading, and error states
 */
export function useMyEntity(id?: string) {
  const { data, loading, error, execute } = useAsyncState<MyEntity>()

  useEffect(() => {
    if (!id) return

    execute(async () => {
      return await myService.getById(id)
    })
  }, [id, execute])

  return {
    entity: data,
    loading,
    error,
  }
}
```

## Padrões de Uso

### Padrão: Fetch com useAsyncState

```tsx
const { data, loading, error, execute } = useAsyncState<Event[]>()

useEffect(() => {
  execute(async () => {
    return await eventsService.getAll()
  })
}, [execute])

// Usar em layout
<ViewScreenLayout
  loading={loading}
  error={error}
  empty={!loading && !data?.length && !error}
/>
```

### Padrão: Fetch Manual com Estados Locais

```tsx
const [events, setEvents] = useState<Event[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const fetchEvents = useCallback(async () => {
  try {
    setError(null)
    const data = await eventsService.getAll()
    setEvents(data)
  } catch (err) {
    setError('Erro ao carregar eventos')
  } finally {
    setLoading(false)
  }
}, [])

useEffect(() => {
  fetchEvents()
}, [fetchEvents])
```

### Padrão: Pull-to-Refresh

```tsx
const [refreshing, setRefreshing] = useState(false)

const handleRefresh = useCallback(async () => {
  setRefreshing(true)
  try {
    await fetchEvents()
  } finally {
    setRefreshing(false)
  }
}, [fetchEvents])

<ViewScreenLayout
  refreshing={refreshing}
  onRefresh={handleRefresh}
/>
```

### Padrão: Busca com Debounce

```tsx
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearch.length >= 2) {
    searchAPI(debouncedSearch)
  }
}, [debouncedSearch])
```

## Regras de Uso

### ✅ DO

- Use services para todas as chamadas de API
- Use hooks para lógica reutilizável
- Use `useAsyncState` para operações assíncronas
- Use `useDebounce` para busca
- Trate erros adequadamente
- Exporte tipos junto com services

### ❌ DON'T

- Não faça chamadas de API diretamente (use services)
- Não duplique lógica de hooks existentes
- Não ignore erros
- Não use `any` em tipos de services/hooks

---

**Última atualização:** 2024-12-19


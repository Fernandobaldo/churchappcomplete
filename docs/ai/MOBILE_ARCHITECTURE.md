# Mobile Architecture — Guia Completo

## Princípios Arquiteturais

### 1. Separação de Responsabilidades

```
┌─────────────┐
│   Screens   │ ← Orquestram dados, estado e composição
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Layouts   │ ← Controlam scroll, refresh, keyboard, estados
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Components  │ ← Apresentação pura (props in, JSX out)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Hooks    │ ← Lógica reutilizável (podem chamar services)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Services   │ ← Chamadas HTTP e transformação de dados
└─────────────┘
```

### 2. Regras de Ouro

#### ✅ DO: Componentes Apresentacionais

```tsx
// ✅ CORRETO: Componente recebe dados via props
export function EventCard({ event }: { event: Event }) {
  return <View>...</View>
}
```

#### ❌ DON'T: Componentes Fazendo Fetch

```tsx
// ❌ ERRADO: Componente fazendo chamada de API
export function EventCard({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null)
  useEffect(() => {
    api.get(`/events/${eventId}`).then(...) // ❌ NÃO FAÇA ISSO
  }, [eventId])
  return <View>...</View>
}
```

#### ✅ DO: Usar Layouts Padronizados

```tsx
// ✅ CORRETO: Tela usa ViewScreenLayout
export default function EventsScreen() {
  return (
    <ViewScreenLayout
      headerProps={{ title: "Eventos" }}
      loading={loading}
      error={error}
      empty={isEmpty}
      onRefresh={handleRefresh}
    >
      <FlatList data={events} ... />
    </ViewScreenLayout>
  )
}
```

#### ❌ DON'T: Criar ScrollView Manualmente

```tsx
// ❌ ERRADO: ScrollView manual dentro de layout
export default function EventsScreen() {
  return (
    <ViewScreenLayout>
      <ScrollView> {/* ❌ Layout já tem ScrollView */}
        <FlatList ... />
      </ScrollView>
    </ViewScreenLayout>
  )
}
```

#### ✅ DO: Usar Services para API Calls

```tsx
// ✅ CORRETO: Service encapsula chamada
import { eventsService } from '../services'

const fetchEvents = async () => {
  const events = await eventsService.getAll()
  setEvents(events)
}
```

#### ❌ DON'T: Chamar API Diretamente em Screens

```tsx
// ❌ ERRADO: Chamada direta ao axios
import api from '../api/api'

const fetchEvents = async () => {
  const res = await api.get('/events') // ❌ Use service
  setEvents(res.data)
}
```

## Fluxo de Dados

### 1. Tela de Lista (ViewScreenLayout)

```tsx
export default function EventsScreen() {
  // 1. Estado local
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 2. Fetch function
  const fetchEvents = useCallback(async () => {
    try {
      setError(null)
      const data = await eventsService.getAll()
      setEvents(data)
    } catch (err) {
      setError('Erro ao carregar eventos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 3. useEffect para carregar inicial
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 4. useFocusEffect para recarregar ao voltar
  useFocusEffect(
    useCallback(() => {
      if (!loading && !refreshing) {
        fetchEvents()
      }
    }, [fetchEvents, loading, refreshing])
  )

  // 5. Handler de refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchEvents()
  }, [fetchEvents])

  // 6. Handler de retry
  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchEvents().finally(() => setLoading(false))
  }, [fetchEvents])

  // 7. Estado empty
  const isEmpty = !loading && events.length === 0 && !error

  // 8. Render com layout
  return (
    <ViewScreenLayout
      headerProps={{ title: "Eventos" }}
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyTitle="Nenhum evento encontrado"
      onRefresh={handleRefresh}
      onRetry={handleRetry}
      scrollable={false} // Para FlatList
    >
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.id}
      />
    </ViewScreenLayout>
  )
}
```

### 2. Tela de Detalhe (DetailScreenLayout)

```tsx
export default function EventDetailsScreen() {
  const route = useRoute()
  const { id } = route.params as { id: string }

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvent = useCallback(async () => {
    try {
      setError(null)
      const data = await eventsService.getById(id)
      setEvent(data)
    } catch (err) {
      setError('Erro ao carregar evento')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  useFocusEffect(
    useCallback(() => {
      if (!loading && !refreshing) {
        fetchEvent()
      }
    }, [fetchEvent, loading, refreshing])
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchEvent()
  }, [fetchEvent])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchEvent().finally(() => setLoading(false))
  }, [fetchEvent])

  const isEmpty = !loading && !event && !error

  return (
    <DetailScreenLayout
      headerProps={{ title: "Detalhes do Evento" }}
      imageUrl={event?.imageUrl}
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyTitle="Evento não encontrado"
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      {event && (
        <GlassCard>
          <Text>{event.title}</Text>
          {/* ... mais conteúdo ... */}
        </GlassCard>
      )}
    </DetailScreenLayout>
  )
}
```

### 3. Tela de Formulário (FormScreenLayout)

```tsx
export default function AddEventScreen() {
  const navigation = useNavigation()
  const [form, setForm] = useState({
    title: '',
    startDate: '',
    // ...
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fields = [
    { key: 'title', label: 'Título', type: 'string' as const, required: true },
    // ...
  ]

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      await eventsService.create(form)
      navigation.goBack()
      Toast.show({ type: 'success', text1: 'Evento criado!' })
    } catch (err) {
      setError('Erro ao criar evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormScreenLayout
      headerProps={{ title: "Criar Evento" }}
      loading={loading}
      error={error}
      onRetry={handleSubmit}
    >
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={handleSubmit}
      />
    </FormScreenLayout>
  )
}
```

## Gerenciamento de Estado

### Estado Local (useState)

Use para:
- Dados da tela atual
- Estado de formulários
- Flags de UI (loading, error, etc.)

### Estado Global (Zustand)

Use apenas para:
- Autenticação (`authStore`)
- Dados compartilhados entre muitas telas

### Hooks Customizados

Use para abstrair lógica comum:

```tsx
// useAsyncState: Gerencia loading/error/data
const { data, loading, error, execute } = useAsyncState<Event[]>()

useEffect(() => {
  execute(async () => {
    return await eventsService.getAll()
  })
}, [execute])

// usePullToRefresh: Gerencia refreshing
const { refreshing, onRefresh } = usePullToRefresh(fetchEvents)

// useDebounce: Debounce de valores
const debouncedSearch = useDebounce(searchTerm, 300)
```

## Tratamento de Erros

### Padrão de Erro

```tsx
try {
  setError(null)
  const data = await service.getData()
  setData(data)
} catch (err: any) {
  const errorMessage = err.response?.data?.message || 'Erro ao carregar dados'
  setError(errorMessage)
  console.error('Erro:', err)
} finally {
  setLoading(false)
}
```

### Estados de Erro nos Layouts

```tsx
<ViewScreenLayout
  error={error}
  onRetry={handleRetry} // Mostra botão "Tentar novamente"
/>
```

## Performance

### useMemo para Cálculos Pesados

```tsx
const filteredEvents = useMemo(() => {
  return events.filter(e => e.status === 'active')
}, [events])
```

### useCallback para Handlers

```tsx
const handleRefresh = useCallback(() => {
  fetchEvents()
}, [fetchEvents]) // Dependências mínimas
```

### FlatList para Listas Grandes

```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  onEndReached={loadMore} // Paginação
  onEndReachedThreshold={0.5}
/>
```

## Navegação

### Navegação com Parâmetros

```tsx
navigation.navigate('EventDetails', { id: event.id })
```

### Recebendo Parâmetros

```tsx
const route = useRoute()
const { id } = route.params as { id: string }
```

### Recarregar ao Voltar

```tsx
useFocusEffect(
  useCallback(() => {
    if (!loading && !refreshing) {
      fetchData()
    }
  }, [fetchData, loading, refreshing])
)
```

## Boas Práticas

### ✅ DO

- Use layouts padronizados
- Encapsule API calls em services
- Use hooks para lógica reutilizável
- Passe estados para layouts (loading, error, empty)
- Use `useFocusEffect` para recarregar dados
- Valide dados antes de enviar
- Trate erros adequadamente
- Use TypeScript em tudo

### ❌ DON'T

- Não faça chamadas de API em componentes
- Não crie ScrollView manualmente dentro de layouts
- Não duplique lógica de estado
- Não use `any` desnecessariamente
- Não ignore erros
- Não faça fetch sem tratamento de loading/error
- Não esqueça de limpar listeners/subscriptions

---

**Última atualização:** 2024-12-19


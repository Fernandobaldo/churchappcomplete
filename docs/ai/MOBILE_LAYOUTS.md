# Mobile Layouts — Guia Completo

## Visão Geral

O app usa **3 layouts padronizados** que encapsulam scroll, refresh, keyboard handling e estados (loading/error/empty). Todas as telas devem usar um desses layouts.

## ViewScreenLayout

### Propósito

Listas, dashboards, telas de visualização com conteúdo scrollável ou FlatList.

### Props

```typescript
type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  scrollable?: boolean              // Default: true
  refreshing?: boolean
  onRefresh?: () => void
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  onRetry?: () => void
  topSlot?: React.ReactNode       // Conteúdo antes do children
  bottomSlot?: React.ReactNode    // Conteúdo depois do children
  floatingSlot?: React.ReactNode  // Conteúdo flutuante (absolute)
  contentContainerStyle?: ViewStyle
  backgroundColor?: string
  backgroundImageUri?: string
}
```

### Características

- **ScrollView opcional**: Se `scrollable={false}`, renderiza `View` (útil para FlatList)
- **Pull-to-refresh**: Funciona mesmo quando `loading`/`error`/`empty` está ativo
- **Estados padronizados**: LoadingState, ErrorState, EmptyState
- **Prioridade de renderização**: `loading` > `error` > `empty` > `children`

### Uso com FlatList

```tsx
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
  scrollable={false}  // ← Importante para FlatList
  loading={loading}
  error={error}
  empty={isEmpty}
  onRefresh={handleRefresh}
>
  <FlatList
    data={events}
    renderItem={({ item }) => <EventCard event={item} />}
    keyExtractor={(item) => item.id}
  />
</ViewScreenLayout>
```

### Uso com ScrollView

```tsx
<ViewScreenLayout
  headerProps={{ title: "Dashboard" }}
  scrollable={true}  // Default
  loading={loading}
  onRefresh={handleRefresh}
>
  <View>
    <Text>Conteúdo scrollável</Text>
  </View>
</ViewScreenLayout>
```

### Uso com Tabs

```tsx
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
  scrollable={false}
  loading={loading}
  empty={isGlobalEmpty}  // ← Empty baseado em TODOS os dados
  onRefresh={handleRefresh}
>
  <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
  <FlatList
    data={filteredEvents}
    ListEmptyComponent={
      isTabEmpty ? <EmptyState title="Nenhum evento nesta categoria" /> : null
    }
  />
</ViewScreenLayout>
```

### ⚠️ Regras Importantes

1. **NÃO crie ScrollView manualmente** dentro de ViewScreenLayout
2. **Use `scrollable={false}`** quando usar FlatList
3. **Passar `empty={isGlobalEmpty}`** em telas com tabs (não tab-specific empty)
4. **Pull-to-refresh funciona** mesmo quando `loading`/`error`/`empty` está ativo

## DetailScreenLayout

### Propósito

Detalhes de itens únicos (eventos, membros, transações, perfis).

### Props

```typescript
type DetailScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  imageUrl?: string | null         // Banner/hero image
  loading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  onRetry?: () => void
  topSlot?: React.ReactNode
  bottomSlot?: React.ReactNode
  floatingSlot?: React.ReactNode
  backgroundColor?: string
  backgroundImageUri?: string
}
```

### Características

- **Sempre tem ScrollView**: Não precisa (e não deve) criar ScrollView manualmente
- **Banner image**: Suporta imagem hero no topo (não renderiza durante loading/error/empty)
- **Pull-to-refresh**: Suporta refresh manual
- **Estados padronizados**: LoadingState, ErrorState, EmptyState

### Uso Básico

```tsx
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
```

### ⚠️ Regras Importantes

1. **NUNCA crie `<ScrollView>` manualmente** dentro de DetailScreenLayout
2. **`empty` deve ser GLOBAL** para o item (404/missing), não para sub-seções
3. **Banner image não renderiza** durante `loading`/`error`/`empty`
4. **Sempre envolva conteúdo** que acessa dados em `{entity && (...)}` para evitar null reference

## FormScreenLayout

### Propósito

Formulários de criação/edição (Add/Edit screens).

### Props

```typescript
type FormScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  loading?: boolean              // Apenas para carregamento inicial de dados
  error?: string | null          // Apenas para erros de carregamento inicial
  empty?: boolean                // Raramente usado (só se dados obrigatórios não existem)
  emptyTitle?: string
  emptySubtitle?: string
  onRetry?: () => void
  topSlot?: React.ReactNode
  bottomSlot?: React.ReactNode
  floatingSlot?: React.ReactNode
  contentContainerStyle?: ViewStyle
  backgroundColor?: string
  backgroundImageUri?: string
}
```

### Características

- **Sempre tem ScrollView**: Com KeyboardAvoidingView para evitar teclado
- **Keyboard handling**: Ajusta automaticamente quando teclado aparece
- **Estados apenas para carregamento inicial**: `loading`/`error` para dados iniciais (edit screens)
- **Sem pull-to-refresh**: Formulários são estáticos até salvar

### Uso em Create Screen

```tsx
<FormScreenLayout
  headerProps={{ title: "Criar Evento" }}
>
  <FormsComponent
    form={form}
    setForm={setForm}
    fields={fields}
    onSubmit={handleSubmit}
  />
</FormScreenLayout>
```

### Uso em Edit Screen

```tsx
<FormScreenLayout
  headerProps={{ title: "Editar Evento" }}
  loading={loading}        // ← Carregamento inicial
  error={error}            // ← Erro ao carregar dados
  onRetry={handleRetry}    // ← Retry do carregamento inicial
>
  <FormsComponent
    form={form}
    setForm={setForm}
    fields={fields}
    onSubmit={handleSubmit}
  />
</FormScreenLayout>
```

### ⚠️ Regras Importantes

1. **NÃO crie `<ScrollView>` manualmente** dentro de FormScreenLayout
2. **`loading`/`error` apenas para carregamento inicial** (edit screens)
3. **Validação de formulário** é responsabilidade do FormsComponent, não do layout
4. **Não use `empty`** a menos que dados obrigatórios não existam

## Estados Padronizados

Todos os layouts suportam estados via props com **prioridade**:

```
1. loading → LoadingState
2. error → ErrorState (com botão "Tentar novamente")
3. empty → EmptyState (com título/subtítulo customizáveis)
4. children → Conteúdo normal
```

### Exemplo de Prioridade

```tsx
<ViewScreenLayout
  loading={true}   // ← Mostra LoadingState (ignora error/empty)
  error="Erro"
  empty={true}
>
  <Text>Isso não aparece</Text>
</ViewScreenLayout>
```

## Slots (topSlot, bottomSlot, floatingSlot)

Todos os layouts suportam slots para conteúdo adicional:

```tsx
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
  topSlot={<Tabs ... />}              // Antes do children
  bottomSlot={<FloatingButton />}     // Depois do children
  floatingSlot={<FAB />}              // Flutuante (absolute)
>
  <FlatList ... />
</ViewScreenLayout>
```

## Pull-to-Refresh

### ViewScreenLayout e DetailScreenLayout

```tsx
const [refreshing, setRefreshing] = useState(false)

const handleRefresh = useCallback(() => {
  setRefreshing(true)
  fetchData().finally(() => setRefreshing(false))
}, [fetchData])

<ViewScreenLayout
  refreshing={refreshing}
  onRefresh={handleRefresh}
/>
```

### Funciona em Estados

Pull-to-refresh funciona mesmo quando `loading`/`error`/`empty` está ativo (especialmente importante para `scrollable={false}`).

## Templates de Uso

### Template: Lista com Tabs

```tsx
export default function EventsScreen() {
  const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // ... fetch logic ...

  const events = useMemo(() => {
    // Filtrar baseado na tab
    return allEvents.filter(...)
  }, [allEvents, tab])

  const isGlobalEmpty = !loading && allEvents.length === 0 && !error
  const isTabEmpty = !loading && events.length === 0 && allEvents.length > 0

  return (
    <ViewScreenLayout
      headerProps={{ title: "Eventos" }}
      scrollable={false}
      loading={loading}
      error={error}
      empty={isGlobalEmpty}
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          isTabEmpty ? <EmptyState title="Nenhum evento nesta categoria" /> : null
        }
      />
    </ViewScreenLayout>
  )
}
```

### Template: Detalhe com Banner

```tsx
export default function EventDetailsScreen() {
  const route = useRoute()
  const { id } = route.params as { id: string }
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ... fetch logic ...

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
        </GlassCard>
      )}
    </DetailScreenLayout>
  )
}
```

### Template: Formulário de Edição

```tsx
export default function EditEventScreen() {
  const route = useRoute()
  const { id } = route.params as { id: string }
  
  const [form, setForm] = useState({ ... })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()
  }, [])

  const handleRetry = () => {
    setLoading(true)
    fetchEvent().finally(() => setLoading(false))
  }

  return (
    <FormScreenLayout
      headerProps={{ title: "Editar Evento" }}
      loading={loading}
      error={error}
      onRetry={handleRetry}
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

## Checklist de Uso

### ✅ Antes de Criar uma Tela

- [ ] Identifique qual layout usar (View/Detail/Form)
- [ ] Defina estados necessários (loading, error, empty)
- [ ] Implemente handlers (fetch, refresh, retry)
- [ ] Use `useFocusEffect` se necessário
- [ ] Não crie ScrollView manualmente
- [ ] Passe estados para o layout
- [ ] Envolva conteúdo que acessa dados em `{entity && (...)}`

---

**Última atualização:** 2024-12-19


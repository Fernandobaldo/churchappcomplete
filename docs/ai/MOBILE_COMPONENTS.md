# Mobile Components — Guia Completo

## Componentes de Estado

### LoadingState

**Localização:** `components/states/LoadingState.tsx`

**Uso:** Exibido automaticamente pelos layouts quando `loading={true}`.

```tsx
// Não use diretamente, layouts fazem isso automaticamente
<ViewScreenLayout loading={true} />
```

### ErrorState

**Localização:** `components/states/ErrorState.tsx`

**Props:**
```typescript
{
  message?: string
  onRetry?: () => void
}
```

**Uso:** Exibido automaticamente pelos layouts quando `error` está definido.

```tsx
<ViewScreenLayout
  error="Erro ao carregar dados"
  onRetry={handleRetry}
/>
```

### EmptyState

**Localização:** `components/states/EmptyState.tsx`

**Props:**
```typescript
{
  title?: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}
```

**Uso:** Exibido automaticamente pelos layouts quando `empty={true}`.

```tsx
<ViewScreenLayout
  empty={true}
  emptyTitle="Nenhum item encontrado"
  emptySubtitle="Tente novamente mais tarde"
/>
```

## Componentes de Layout

### PageHeader

**Localização:** `components/PageHeader.tsx`

**Props:**
```typescript
{
  title: string
  Icon?: React.ComponentType<any>
  iconName?: string
  rightButtonIcon?: React.ReactNode
  onRightButtonPress?: () => void
  onBackPress?: () => void
  // ... mais props
}
```

**Uso:**
```tsx
<PageHeader
  title="Eventos"
  Icon={FontAwesome5}
  iconName="calendar"
  rightButtonIcon={<Ionicons name="add" />}
  onRightButtonPress={() => navigation.navigate('AddEvent')}
/>
```

### GlassCard

**Localização:** `components/GlassCard.tsx`

**Props:**
```typescript
{
  children: React.ReactNode
  opacity?: number
  blurIntensity?: number
  borderRadius?: number
  style?: ViewStyle
}
```

**Uso:**
```tsx
<GlassCard opacity={0.4} blurIntensity={20} borderRadius={20}>
  <Text>Conteúdo</Text>
</GlassCard>
```

### GlassBackground

**Localização:** `components/GlassBackground.tsx`

**Uso:** Usado internamente pelos layouts. Não use diretamente.

## Componentes de Formulário

### FormsComponent

**Localização:** `components/FormsComponent.tsx`

**Props:**
```typescript
{
  form: Record<string, any>
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>
  fields: Field[]
  onSubmit: () => void
  submitLabel?: string
  hideButtons?: boolean
}
```

**Tipos Exportados:**
```typescript
export type FieldType = 'string' | 'number' | 'email' | 'password' | 'date' | 'time' | 'image' | 'toggle' | 'select'

export type Field = {
  key: string
  label: string
  placeholder?: string
  secure?: boolean
  required?: boolean
  type?: FieldType
  dependsOn?: string
  options?: SelectOption[]
  error?: string
}

export type SelectOption = {
  key: string
  label: string
  value: string
}
```

**Uso:**
```tsx
const [form, setForm] = useState({
  title: '',
  startDate: '',
})

const fields: Field[] = [
  { key: 'title', label: 'Título', type: 'string', required: true },
  { key: 'startDate', label: 'Data', type: 'date', required: true },
]

<FormsComponent
  form={form}
  setForm={setForm}
  fields={fields}
  onSubmit={handleSubmit}
/>
```

**Tipos de Campo Suportados:**
- `string`: Texto simples
- `number`: Número
- `email`: Email (keyboard type email)
- `password`: Senha (secure text entry)
- `date`: Data (DateTimePicker)
- `time`: Hora (DateTimePicker)
- `image`: Upload de imagem
- `toggle`: Switch
- `select`: Dropdown (ModalSelector)

**Dependências (`dependsOn`):**
```tsx
const fields = [
  { key: 'hasDonation', label: 'Tem doação?', type: 'toggle' },
  { key: 'donationLink', label: 'Link de doação', type: 'string', dependsOn: 'hasDonation' },
]
// donationLink só aparece se hasDonation === true
```

### TextInputField

**Localização:** `components/TextInputField.tsx`

**Uso:** Usado internamente pelo FormsComponent. Não use diretamente.

### DateTimePicker

**Localização:** `components/DateTimePicker.tsx`

**Uso:** Usado internamente pelo FormsComponent. Não use diretamente.

### TimePicker

**Localização:** `components/TimePicker.tsx`

**Uso:** Componente standalone para seleção de hora (HH:mm).

```tsx
<TimePicker
  value={time}
  onChange={setTime}
/>
```

## Componentes de Busca

### MemberSearch

**Localização:** `components/MemberSearch.tsx`

**Props:**
```typescript
{
  value?: string              // ID do membro selecionado
  onChange: (memberId: string | null, memberName?: string) => void
  placeholder?: string
}
```

**Uso:**
```tsx
<MemberSearch
  value={selectedMemberId}
  onChange={(id, name) => {
    setSelectedMemberId(id)
    setSelectedMemberName(name)
  }}
  placeholder="Buscar membro..."
/>
```

**Características:**
- Busca com debounce automático (300ms)
- Mínimo 2 caracteres para buscar
- Dropdown com resultados
- Suporta busca server-side (se backend suportar) ou client-side

## Componentes de Navegação

### Tabs

**Localização:** `components/Tabs.tsx`

**Props:**
```typescript
{
  tabs: Array<{ key: string; label: string }>
  activeTab: string
  onTabChange: (tab: string) => void
}
```

**Uso:**
```tsx
const tabs = [
  { key: 'proximos', label: 'Próximos' },
  { key: 'passados', label: 'Passados' },
]

<Tabs
  tabs={tabs}
  activeTab={tab}
  onTabChange={setTab}
/>
```

## Componentes de Conteúdo

### BibleText

**Localização:** `components/BibleText.tsx`

**Props:**
```typescript
{
  passage: string  // Ex: "João 3:16"
}
```

**Uso:**
```tsx
<BibleText passage="João 3:16" />
```

**Características:**
- Busca texto da Bíblia automaticamente
- Usa `useBiblePassage` hook internamente
- Mostra loading enquanto busca
- Trata erros automaticamente

### EventCard

**Localização:** `components/EventCard.tsx`

**Uso:** Card para exibir evento em listas.

```tsx
<EventCard event={event} />
```

### DevotionalCard

**Localização:** `components/DevotionalCard.tsx`

**Uso:** Card para exibir devocional em listas.

```tsx
<DevotionalCard devotional={devotional} />
```

## Componentes de Proteção

### Protected

**Localização:** `components/Protected.tsx`

**Props:**
```typescript
{
  permission: string
  children: React.ReactNode
}
```

**Uso:**
```tsx
<Protected permission="events_manage">
  <TouchableOpacity onPress={handleEdit}>
    <Text>Editar</Text>
  </TouchableOpacity>
</Protected>
```

**Comportamento:** Mostra "Access Denied" se usuário não tiver permissão.

### PermissionGuard

**Localização:** `components/PermissionGuard.tsx`

**Uso:** Similar ao Protected, usado em rotas.

### withPermissionProtection

**Localização:** `components/withPermissionProtection.tsx`

**Uso:** HOC para proteger componentes.

## Componentes de UI

### Header

**Localização:** `components/Header.tsx`

**Uso:** Header principal do app (logo, título, avatar).

```tsx
<Header />
```

**Características:**
- Componente apresentacional
- Usa `useMe()` e `useNextEvent()` hooks internamente
- Não faz chamadas de API diretamente

## Regras de Uso

### ✅ DO

- Use componentes de estado apenas via layouts
- Use FormsComponent para formulários dinâmicos
- Use MemberSearch para busca de membros
- Use Protected para proteção por permissão
- Use GlassCard para containers de conteúdo

### ❌ DON'T

- Não use LoadingState/ErrorState/EmptyState diretamente (use via layouts)
- Não crie componentes que fazem chamadas de API
- Não duplique lógica de componentes existentes
- Não use `any` em props de componentes

## Criando Novos Componentes

### Template de Componente Apresentacional

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type MyComponentProps = {
  title: string
  onPress?: () => void
}

export default function MyComponent({ title, onPress }: MyComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
})
```

### Checklist

- [ ] Componente é apresentacional (sem API calls)
- [ ] Props tipadas com TypeScript
- [ ] Estilos usando StyleSheet
- [ ] Export default para componente
- [ ] Export named para tipos (se necessário)

---

**Última atualização:** 2024-12-19


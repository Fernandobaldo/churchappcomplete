# 🚀 Layouts Cheatsheet - Referência Rápida

## 📱 Qual Layout Usar?

```
┌─────────────────────────────────────────────────────────┐
│  Sua tela tem...                                        │
├─────────────────────────────────────────────────────────┤
│  ✏️  Formulário com inputs?        → FormScreenLayout   │
│  🗂️  Lista de itens (FlatList)?    → ListScreenLayout   │
│  📄  Detalhes de um item?          → DetailScreenLayout │
│  👁️  Dashboard/conteúdo misto?     → ViewScreenLayout   │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ ListScreenLayout

```typescript
import { ListScreenLayout } from '../components/layouts'

<ListScreenLayout
  headerProps={{ title: "Título" }}
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  loading={loading}
  refreshing={refreshing}
  onRefresh={handleRefresh}
  ListHeaderComponent={<Tabs />}
  ListEmptyComponent={<EmptyState />}
/>
```

**Props Principais:**
- `headerProps` - Props do PageHeader
- `data` - Array de items
- `renderItem` - Função para renderizar cada item
- `keyExtractor` - Função para extrair key única
- `loading` - Boolean para loading inicial
- `refreshing` - Boolean para pull-to-refresh
- `onRefresh` - Callback para refresh

---

## ✏️ FormScreenLayout

```typescript
import { FormScreenLayout } from '../components/layouts'

<FormScreenLayout
  headerProps={{ title: "Título" }}
  backgroundColor="#f5f5f5"
  contentContainerStyle={{ padding: 20 }}
>
  <TextInput />
  <TextInput />
  <Button onPress={handleSubmit} />
</FormScreenLayout>
```

**Props Principais:**
- `headerProps` - Props do PageHeader
- `backgroundColor` - Cor de fundo (padrão: #f5f5f5)
- `contentContainerStyle` - Estilos do conteúdo

**Features Automáticas:**
- ✅ KeyboardAvoidingView
- ✅ Dismiss teclado ao tocar fora
- ✅ ScrollView otimizado

---

## 📄 DetailScreenLayout

```typescript
import { DetailScreenLayout } from '../components/layouts'

<DetailScreenLayout
  headerProps={{ title: "Título" }}
  imageUrl={item?.imageUrl}
  loading={loading}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <Text style={styles.title}>{item?.title}</Text>
  <Text style={styles.description}>{item?.description}</Text>
</DetailScreenLayout>
```

**Props Principais:**
- `headerProps` - Props do PageHeader
- `imageUrl` - URL da imagem de destaque (opcional)
- `loading` - Boolean para loading inicial
- `refreshing` - Boolean para pull-to-refresh
- `onRefresh` - Callback para refresh

---

## 👁️ ViewScreenLayout

```typescript
import { ViewScreenLayout } from '../components/layouts'

// Com scroll (padrão)
<ViewScreenLayout
  headerProps={{ title: "Título" }}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <View>{/* conteúdo */}</View>
</ViewScreenLayout>

// Sem scroll (para FlatList customizado)
<ViewScreenLayout
  headerProps={{ title: "Título" }}
  scrollable={false}
  contentContainerStyle={{ flex: 1, padding: 0 }}
>
  <Tabs />
  <FlatList data={items} renderItem={renderItem} />
</ViewScreenLayout>
```

**Props Principais:**
- `headerProps` - Props do PageHeader
- `scrollable` - Boolean para habilitar/desabilitar scroll (padrão: true)
- `refreshing` - Boolean para pull-to-refresh
- `onRefresh` - Callback para refresh
- `contentContainerStyle` - Estilos do conteúdo

---

## 🎨 PageHeader Props

Todos os layouts aceitam `headerProps` com as seguintes opções:

```typescript
headerProps={{
  // Opção 1: Título simples
  title: "Minha Tela",
  
  // Opção 2: Título com ícone
  title: "Minha Tela",
  Icon: Ionicons,
  iconName: "calendar",
  
  // Opção 3: Logo e nome da igreja
  churchLogo: "https://...",
  churchName: "Igreja ABC",
  
  // Botão direito
  rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
  onRightButtonPress: () => navigation.navigate('AddScreen'),
  
  // Avatar do usuário
  userAvatar: "https://...",
  userName: "João Silva",
  onAvatarPress: () => navigation.navigate('ProfileScreen'),
  
  // Cor de fundo customizada
  backgroundColor: "#3366FF",
}}
```

---

## 🎯 Exemplos por Tipo de Tela

### Tela de Lista

```typescript
export default function MembersListScreen() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  return (
    <ListScreenLayout
      headerProps={{
        title: "Membros",
        rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
        onRightButtonPress: () => navigation.navigate('AddMember'),
      }}
      data={members}
      renderItem={({ item }) => <MemberCard member={item} />}
      keyExtractor={(item) => item.id}
      loading={loading}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true)
        await fetchMembers()
        setRefreshing(false)
      }}
    />
  )
}
```

### Tela de Formulário

```typescript
export default function AddEventScreen() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  return (
    <FormScreenLayout
      headerProps={{ title: "Novo Evento" }}
    >
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </FormScreenLayout>
  )
}
```

### Tela de Detalhes

```typescript
export default function EventDetailsScreen({ route }) {
  const { id } = route.params
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  return (
    <DetailScreenLayout
      headerProps={{ title: "Detalhes do Evento" }}
      imageUrl={event?.imageUrl}
      loading={loading}
    >
      <Text style={styles.title}>{event?.title}</Text>
      <Text style={styles.date}>
        {format(new Date(event?.date), "dd/MM/yyyy")}
      </Text>
      <Text style={styles.description}>{event?.description}</Text>
    </DetailScreenLayout>
  )
}
```

### Tela de Dashboard

```typescript
export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false)

  return (
    <ViewScreenLayout
      headerProps={{
        churchLogo: churchInfo?.logoUrl,
        churchName: churchInfo?.name,
        userAvatar: userAvatar,
        userName: user?.name,
        onAvatarPress: () => navigation.navigate('Profile'),
      }}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
      }}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Bem-vindo!</Text>
      </View>
      
      <View style={styles.statsCards}>
        <StatCard title="Membros" value="150" />
        <StatCard title="Eventos" value="5" />
      </View>
    </ViewScreenLayout>
  )
}
```

---

## ⚡ Atalhos de Importação

```typescript
// Importação individual
import ListScreenLayout from '../components/layouts/ListScreenLayout'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'

// Importação centralizada (recomendado)
import {
  ListScreenLayout,
  FormScreenLayout,
  DetailScreenLayout,
  ViewScreenLayout,
} from '../components/layouts'
```

---

## 🎨 Estilos Comuns

### Não precisa mais destes estilos:

```typescript
// ❌ Remova
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    marginTop: 110,
  },
  scrollContent: {
    padding: 16,
  },
})
```

### Mantenha apenas estilos específicos:

```typescript
// ✅ Mantenha
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3366FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
})
```

---

## 🔧 Customização Avançada

### Cor de fundo customizada

```typescript
<FormScreenLayout
  headerProps={{ title: "Formulário" }}
  backgroundColor="#ffffff"
>
  {/* conteúdo */}
</FormScreenLayout>
```

### Padding customizado

```typescript
<ViewScreenLayout
  headerProps={{ title: "Dashboard" }}
  contentContainerStyle={{ padding: 24 }}
>
  {/* conteúdo */}
</ViewScreenLayout>
```

### Desabilitar scroll

```typescript
<ViewScreenLayout
  headerProps={{ title: "Eventos" }}
  scrollable={false}
>
  <FlatList data={events} renderItem={renderEvent} />
</ViewScreenLayout>
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Conteúdo coberto pelo header | Use um dos layouts (aplicam marginTop automático) |
| Scroll não funciona | ViewScreenLayout: `scrollable={true}` (padrão) |
| Teclado cobre inputs | Use FormScreenLayout (KeyboardAvoidingView integrado) |
| Pull-to-refresh não aparece | Passe a prop `onRefresh` |
| Loading não aparece | Use `loading={true}` (ListScreenLayout/DetailScreenLayout) |

---

## 📊 Checklist de Migração

```
□ Identificar tipo de tela
□ Importar layout apropriado
□ Substituir <View><PageHeader><ScrollView> por <Layout>
□ Mover props do PageHeader para headerProps
□ Remover estilos: container, scrollView, marginTop: 110
□ Testar em iOS e Android
□ Verificar pull-to-refresh
□ Verificar estados de loading
```

---

## 🎯 Regras de Ouro

1. **Sempre use um layout** - Nunca crie estrutura manual
2. **Props no headerProps** - Todas as props do PageHeader vão aqui
3. **Remova estilos base** - container, scrollView, marginTop
4. **Mantenha estilos específicos** - cards, buttons, texts
5. **Type safety** - TypeScript garante props corretas

---

## 📚 Links Úteis

- **Guia Completo:** `LAYOUTS_GUIDE.md`
- **Exemplos Práticos:** `LAYOUTS_EXAMPLES.md`
- **Resumo:** `LAYOUTS_SUMMARY.md`
- **README:** `LAYOUTS_README.md`

---

**Dica:** Mantenha este cheatsheet aberto enquanto migra as telas! 🚀



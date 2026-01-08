# Guia de Layouts Padronizados

Este guia explica a arquitetura de layouts do aplicativo mobile, criada para garantir consistência visual e facilitar a manutenção.

## 📐 Arquitetura

O aplicativo utiliza 4 layouts especializados, cada um otimizado para um tipo específico de tela:

### 1. 🗂️ **ListScreenLayout** - Para telas de listagem

**Quando usar:**
- Telas que exibem listas de itens (FlatList)
- Necessita de pull-to-refresh
- Pode ter paginação infinita
- Precisa de estados de loading e empty

**Características:**
- Header fixo no topo
- FlatList integrado
- Pull-to-refresh automático
- Estados de loading e empty
- Suporte a ListHeaderComponent (ex: Tabs, Filtros)

**Exemplo de uso:**
```typescript
import { ListScreenLayout } from '../components/layouts'

export default function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  return (
    <ListScreenLayout
      headerProps={{
        title: "Membros",
        Icon: Ionicons,
        iconName: "people",
      }}
      data={members}
      renderItem={({ item }) => <MemberCard member={item} />}
      keyExtractor={(item) => item.id}
      loading={loading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>Nenhum membro encontrado</Text>
        </View>
      }
    />
  )
}
```

**Telas que devem usar:**
- MembersListScreen
- ContributionsScreen
- DevotionalsScreen
- PositionsScreen
- InviteLinksScreen
- NoticesScreen (com Tabs)

---

### 2. ✏️ **FormScreenLayout** - Para telas de formulário

**Quando usar:**
- Telas com formulários de criação/edição
- Múltiplos inputs de texto
- Necessita de KeyboardAvoidingView
- Precisa de ScrollView

**Características:**
- Header fixo no topo
- KeyboardAvoidingView integrado
- ScrollView otimizado para formulários
- Dismiss do teclado ao tocar fora
- Padding consistente

**Exemplo de uso:**
```typescript
import { FormScreenLayout } from '../components/layouts'

export default function AddTransactionScreen() {
  return (
    <FormScreenLayout
      headerProps={{
        title: "Nova Transação",
        Icon: Ionicons,
        iconName: "add-circle-outline",
      }}
    >
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      
      {/* ... resto do formulário ... */}
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </FormScreenLayout>
  )
}
```

**Telas que devem usar:**
- AddTransactionScreen ✅
- EditTransactionScreen
- AddEventScreen
- EditEventScreen
- AddContributionsScreen
- AddDevotionalScreen
- AddNoticeScreen
- MemberRegistrationScreen
- EditProfileScreen ✅
- ServiceScheduleFormScreen

---

### 3. 📄 **DetailScreenLayout** - Para telas de detalhes

**Quando usar:**
- Telas que mostram detalhes de um item específico
- Pode ter imagem de destaque no topo
- Necessita de pull-to-refresh
- Conteúdo scrollável

**Características:**
- Header fixo no topo
- Suporte opcional para imagem de destaque
- Pull-to-refresh integrado
- Estado de loading
- ScrollView otimizado

**Exemplo de uso:**
```typescript
import { DetailScreenLayout } from '../components/layouts'

export default function EventDetailsScreen({ route }) {
  const { id } = route.params
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  return (
    <DetailScreenLayout
      headerProps={{
        title: "Detalhes do Evento",
        Icon: FontAwesome5,
        iconName: "calendar",
      }}
      imageUrl={event?.imageUrl}
      loading={loading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Text style={styles.title}>{event?.title}</Text>
      <Text style={styles.description}>{event?.description}</Text>
      
      {/* ... resto do conteúdo ... */}
    </DetailScreenLayout>
  )
}
```

**Telas que devem usar:**
- EventDetailsScreen
- TransactionDetailsScreen
- ContributionDetailScreen
- DevotionalDetailScreen
- MemberDetailsScreen
- ProfileScreen

---

### 4. 👁️ **ViewScreenLayout** - Para telas de visualização/dashboard

**Quando usar:**
- Telas de dashboard/overview
- Conteúdo misto (cards, gráficos, listas)
- Pode ou não precisar de scroll
- Necessita de pull-to-refresh

**Características:**
- Header fixo no topo
- ScrollView opcional (pode ser desabilitado)
- Pull-to-refresh integrado
- Flexível para conteúdo customizado
- Padding consistente

**Exemplo de uso:**
```typescript
import { ViewScreenLayout } from '../components/layouts'

export default function DashboardScreen() {
  return (
    <ViewScreenLayout
      headerProps={{
        churchLogo: churchInfo?.logoUrl,
        churchName: churchInfo?.name,
        userAvatar: userAvatar,
        userName: user?.name,
        onAvatarPress: () => navigation.navigate('ProfileScreen'),
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Bem-vindo!</Text>
      </View>
      
      <View style={styles.statsCards}>
        {/* Cards de estatísticas */}
      </View>
      
      {/* ... mais conteúdo ... */}
    </ViewScreenLayout>
  )
}
```

**Exemplo sem scroll (para telas com FlatList customizado):**
```typescript
import { ViewScreenLayout } from '../components/layouts'

export default function EventsScreen() {
  return (
    <ViewScreenLayout
      headerProps={{
        title: "Eventos",
        Icon: FontAwesome5,
        iconName: "calendar",
      }}
      scrollable={false}
      contentContainerStyle={styles.viewContent}
    >
      <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
      
      <FlatList
        data={events}
        renderItem={renderEvent}
        refreshControl={<RefreshControl ... />}
      />
    </ViewScreenLayout>
  )
}
```

**Telas que devem usar:**
- DashboardScreen ✅
- MoreScreen
- PermissionsScreen ✅
- ChurchSettingsScreen
- SubscriptionScreen
- FinancesScreen ✅
- EventsScreen ✅ (com scrollable={false})

---

## 🎨 Benefícios da Arquitetura

### 1. **Consistência Visual**
Todas as telas do mesmo tipo seguem o mesmo padrão de layout, espaçamento e comportamento.

### 2. **Manutenção Simplificada**
Mudanças no layout (ex: altura do header, padding) são feitas em um único lugar e afetam todas as telas do tipo.

### 3. **Desenvolvimento Mais Rápido**
Novas telas podem ser criadas rapidamente usando o layout apropriado, sem precisar recriar a estrutura base.

### 4. **Menos Código Duplicado**
Lógica comum (KeyboardAvoidingView, RefreshControl, estados de loading) está encapsulada nos layouts.

### 5. **Type Safety**
TypeScript garante que as props corretas sejam passadas para cada layout.

### 6. **Flexibilidade Futura**
Se no futuro você quiser mudar apenas as telas de formulário, por exemplo, basta editar o `FormScreenLayout`.

---

## 📋 Checklist de Migração

Para migrar uma tela existente para usar os layouts:

1. ✅ Identifique o tipo de tela (List, Form, Detail ou View)
2. ✅ Importe o layout apropriado
3. ✅ Substitua a estrutura de `View + PageHeader + ScrollView/FlatList`
4. ✅ Mova as props do `PageHeader` para `headerProps`
5. ✅ Remova estilos de container, scrollView, marginTop: 110
6. ✅ Teste a tela em diferentes dispositivos

---

## 🔧 Customização

Todos os layouts aceitam props de customização:

```typescript
// Customizar cor de fundo
<ViewScreenLayout
  headerProps={{ title: "Minha Tela" }}
  backgroundColor="#ffffff"
>
  {/* conteúdo */}
</ViewScreenLayout>

// Customizar estilos do conteúdo
<FormScreenLayout
  headerProps={{ title: "Formulário" }}
  contentContainerStyle={{ padding: 24 }}
>
  {/* formulário */}
</FormScreenLayout>
```

---

## 📱 Compatibilidade

Todos os layouts são otimizados para:
- ✅ iOS e Android
- ✅ Diferentes tamanhos de tela
- ✅ Modo paisagem e retrato
- ✅ Teclado virtual
- ✅ Pull-to-refresh
- ✅ Acessibilidade

---

## 🚀 Próximos Passos

1. Migrar as telas restantes para usar os layouts apropriados
2. Adicionar animações de transição consistentes
3. Implementar skeleton loading nos layouts
4. Adicionar suporte a modo escuro (dark mode)

---

## 📚 Referências

- [React Native ScrollView](https://reactnative.dev/docs/scrollview)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [React Native KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview)
- [React Navigation](https://reactnavigation.org/)



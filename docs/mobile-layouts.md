# Mobile (Expo/React Native) — Layouts Padronizados

Origem: `mobile/src/components/layouts/*`.

Esta documentação descreve os três tipos de layouts padronizados disponíveis para telas do aplicativo mobile, suas características, uso e páginas que os utilizam.

## 📋 Índice

- [Tipos de Layouts](#tipos-de-layouts)
  - [ViewScreenLayout](#viewscreenlayout)
  - [DetailScreenLayout](#detailscreenlayout)
  - [FormScreenLayout](#formscreenlayout)
- [Comparação entre Layouts](#comparação-entre-layouts)
- [Guia de Uso](#guia-de-uso)
- [Páginas por Tipo](#páginas-por-tipo)

---

## Tipos de Layouts

### ViewScreenLayout

**Uso:** Listas, dashboards, visualizações gerais e páginas de configuração.

**Arquivo:** `mobile/src/components/layouts/ViewScreenLayout.tsx`

**Props:**

```typescript
type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  refreshing?: boolean           // Para pull-to-refresh
  onRefresh?: () => void         // Callback do refresh
  scrollable?: boolean           // Habilita/desabilita ScrollView (default: true)
  contentContainerStyle?: ViewStyle
  backgroundImageUri?: string
}
```

**Características:**
- ✅ ScrollView opcional (controlado por `scrollable` prop)
- ✅ Suporte a pull-to-refresh via `refreshing` e `onRefresh`
- ❌ Sem imagem de banner/hero
- ✅ Pode ser usado com `FlatList` interno (com `scrollable={false}`)

**Padrão de Uso:**

```typescript
// Com ScrollView (padrão)
<ViewScreenLayout
  headerProps={{ title: "Minha Página" }}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <Text>Conteúdo scrollável</Text>
</ViewScreenLayout>

// Com FlatList (sem ScrollView)
<ViewScreenLayout
  headerProps={{ title: "Lista de Itens" }}
  scrollable={false}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <FlatList
    data={items}
    renderItem={({ item }) => <ItemCard item={item} />}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }
  />
</ViewScreenLayout>
```

**Páginas que usam (13 páginas):**
1. `ChurchSettingsScreen.tsx` — Configurações da Igreja
2. `PermissionsScreen.tsx` — Gerenciamento de Permissões
3. `SubscriptionScreen.tsx` — Minha Assinatura
4. `PositionsScreen.tsx` — Cargos da Igreja
5. `MoreScreen.tsx` — Menu "Mais"
6. `DevotionalsScreen.tsx` — Lista de Devocionais (`scrollable={false}` + FlatList)
7. `InviteLinksScreen.tsx` — Links de Convite (`scrollable={false}` + FlatList)
8. `MembersListScreen.tsx` — Lista de Membros (`scrollable={false}` + FlatList)
9. `ContributionsScreen.tsx` — Lista de Contribuições (`scrollable={false}` + FlatList)
10. `EventsScreen.tsx` — Lista de Eventos (`scrollable={false}` + FlatList)
11. `DashboardScreen.tsx` — Dashboard Principal
12. `NoticesScreen.tsx` — Lista de Avisos (`scrollable={false}` + FlatList)
13. `FinancesScreen.tsx` — Finanças (`scrollable={false}` + FlatList)

---

### DetailScreenLayout

**Uso:** Detalhes de um item específico (perfil, evento, transação, etc.).

**Arquivo:** `mobile/src/components/layouts/DetailScreenLayout.tsx`

**Props:**

```typescript
type DetailScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  imageUrl?: string | null        // URL da imagem banner/hero (opcional)
  loading?: boolean               // Estado de carregamento
  refreshing?: boolean            // Para pull-to-refresh
  onRefresh?: () => void          // Callback do refresh
  backgroundImageUri?: string
}
```

**Características:**
- ✅ Sempre usa ScrollView interno (não configurável)
- ✅ Suporte a pull-to-refresh via `refreshing` e `onRefresh`
- ✅ Suporte a imagem banner/hero (`imageUrl`)
- ✅ Estado de loading integrado (`loading` prop)
- ❌ Não deve usar `ScrollView` manual dentro (já fornece)

**Padrão de Uso:**

```typescript
// Com imagem banner
<DetailScreenLayout
  headerProps={{ title: "Detalhes do Evento" }}
  imageUrl={event.imageUrl}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <View style={styles.content}>
    <GlassCard>
      <Text>{event.title}</Text>
    </GlassCard>
  </View>
</DetailScreenLayout>

// Sem imagem banner
<DetailScreenLayout
  headerProps={{ title: "Meu Perfil" }}
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <View style={styles.content}>
    {/* Conteúdo direto - SEM ScrollView manual */}
  </View>
</DetailScreenLayout>
```

**⚠️ Importante:**
- ❌ **NÃO** use `<ScrollView>` manual dentro do `DetailScreenLayout`
- ✅ Use `<View>` para agrupar conteúdo se necessário
- ✅ O layout já fornece o `ScrollView` com suporte a refresh

**Páginas que usam (6 páginas):**
1. `ProfileScreen.tsx` — Perfil do Usuário/Membro
2. `ContributionDetailScreen.tsx` — Detalhes da Contribuição
3. `DevotionalDetailScreen.tsx` — Detalhes do Devocional
4. `MemberDetailsScreen.tsx` — Detalhes do Membro
5. `TransactionDetailsScreen.tsx` — Detalhes da Transação
6. `EventDetailsScreen.tsx` — Detalhes do Evento (com `imageUrl`)

---

### FormScreenLayout

**Uso:** Formulários de criação e edição (Add/Edit).

**Arquivo:** `mobile/src/components/layouts/FormScreenLayout.tsx`

**Props:**

```typescript
type FormScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  contentContainerStyle?: ViewStyle
  backgroundImageUri?: string
}
```

**Características:**
- ✅ Sempre usa ScrollView interno
- ✅ `KeyboardAvoidingView` para evitar que o teclado cubra campos
- ✅ `keyboardShouldPersistTaps="handled"`
- ❌ Sem suporte a pull-to-refresh (não necessário em formulários)
- ✅ Layout otimizado para entrada de dados

**Padrão de Uso:**

```typescript
<FormScreenLayout
  headerProps={{ title: "Adicionar Evento" }}
  contentContainerStyle={styles.formContent}
>
  <TextInputField
    label="Título"
    value={title}
    onChangeText={setTitle}
  />
  {/* Outros campos do formulário */}
</FormScreenLayout>
```

**Páginas que usam (11 páginas):**
1. `ServiceScheduleFormScreen.tsx` — Formulário de Horário de Culto
2. `EditProfileScreen.tsx` — Editar Perfil
3. `EditEventScreen.tsx` — Editar Evento
4. `AddEventScreen.tsx` — Adicionar Evento
5. `AddNoticeScreen.tsx` — Adicionar Aviso
6. `AddDevotionalScreen.tsx` — Adicionar Devocional
7. `AddContributionsScreen.tsx` — Adicionar Contribuição
8. `AddTransactionScreen.tsx` — Adicionar Transação
9. `EditTransactionScreen.tsx` — Editar Transação
10. `EditContributionScreen.tsx` — Editar Contribuição
11. `MemberRegistrationScreen.tsx` — Registro de Membro

---

## Comparação entre Layouts

| Característica | ViewScreenLayout | DetailScreenLayout | FormScreenLayout |
|---------------|------------------|-------------------|------------------|
| **ScrollView** | Opcional (`scrollable` prop) | Sempre | Sempre |
| **FlatList interno** | ✅ Sim (com `scrollable={false}`) | ❌ Não | ❌ Não |
| **Pull-to-refresh** | ✅ Sim (`refreshing`/`onRefresh`) | ✅ Sim (`refreshing`/`onRefresh`) | ❌ Não |
| **Imagem Banner** | ❌ Não | ✅ Sim (`imageUrl`) | ❌ Não |
| **Loading state** | Manual | ✅ Sim (`loading` prop) | Manual |
| **Keyboard handling** | ❌ Não | ❌ Não | ✅ Sim (`KeyboardAvoidingView`) |
| **Uso principal** | Listas, Dashboards, Configurações | Detalhes de item único | Formulários (Add/Edit) |

---

## Guia de Uso

### Quando usar cada layout?

#### Use `ViewScreenLayout` quando:
- 📋 Exibir uma lista de itens (com ou sem `FlatList`)
- 📊 Criar um dashboard ou página de configurações
- 🔄 Precisa de pull-to-refresh
- 📝 Não é um formulário de edição

#### Use `DetailScreenLayout` quando:
- 👁️ Exibir detalhes de um único item
- 🖼️ Quer mostrar uma imagem banner/hero
- 🔄 Precisa de pull-to-refresh
- 📱 Quer layout focado em visualização (não edição)

#### Use `FormScreenLayout` quando:
- ✏️ Criar ou editar dados (formulários)
- ⌨️ Precisa lidar com teclado (campos de texto)
- 📝 Não precisa de refresh (formulários são estáticos até salvar)

### Boas Práticas

#### ✅ ViewScreenLayout com FlatList:

```typescript
<ViewScreenLayout
  headerProps={{ title: "Lista" }}
  scrollable={false}  // IMPORTANTE: desabilitar ScrollView
  refreshing={refreshing}
  onRefresh={handleRefresh}
>
  <FlatList
    data={items}
    renderItem={({ item }) => <ItemCard item={item} />}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }
  />
</ViewScreenLayout>
```

#### ✅ DetailScreenLayout (sem ScrollView manual):

```typescript
// ❌ ERRADO
<DetailScreenLayout>
  <ScrollView>  {/* NÃO fazer isso */}
    <Content />
  </ScrollView>
</DetailScreenLayout>

// ✅ CORRETO
<DetailScreenLayout refreshing={refreshing} onRefresh={handleRefresh}>
  <View style={styles.content}>
    <Content />
  </View>
</DetailScreenLayout>
```

#### ✅ Pull-to-refresh padrão:

```typescript
const [refreshing, setRefreshing] = useState(false)

const handleRefresh = useCallback(async () => {
  setRefreshing(true)
  try {
    await fetchData()
  } finally {
    setRefreshing(false)
  }
}, [fetchData])

// ViewScreenLayout ou DetailScreenLayout
<Layout refreshing={refreshing} onRefresh={handleRefresh}>
  {/* conteúdo */}
</Layout>
```

---

## Páginas por Tipo

### Estatísticas

- **Total de páginas analisadas:** 30
- **ViewScreenLayout:** 13 páginas (43%)
- **DetailScreenLayout:** 6 páginas (20%)
- **FormScreenLayout:** 11 páginas (37%)

### Lista Completa

#### ViewScreenLayout (13 páginas)
- `ChurchSettingsScreen.tsx`
- `PermissionsScreen.tsx`
- `SubscriptionScreen.tsx`
- `PositionsScreen.tsx`
- `MoreScreen.tsx`
- `DevotionalsScreen.tsx`
- `InviteLinksScreen.tsx`
- `MembersListScreen.tsx`
- `ContributionsScreen.tsx`
- `EventsScreen.tsx`
- `DashboardScreen.tsx`
- `NoticesScreen.tsx`
- `FinancesScreen.tsx`

#### DetailScreenLayout (6 páginas)
- `ProfileScreen.tsx`
- `ContributionDetailScreen.tsx`
- `DevotionalDetailScreen.tsx`
- `MemberDetailsScreen.tsx`
- `TransactionDetailsScreen.tsx`
- `EventDetailsScreen.tsx`

#### FormScreenLayout (11 páginas)
- `ServiceScheduleFormScreen.tsx`
- `EditProfileScreen.tsx`
- `EditEventScreen.tsx`
- `AddEventScreen.tsx`
- `AddNoticeScreen.tsx`
- `AddDevotionalScreen.tsx`
- `AddContributionsScreen.tsx`
- `AddTransactionScreen.tsx`
- `EditTransactionScreen.tsx`
- `EditContributionScreen.tsx`
- `MemberRegistrationScreen.tsx`

### Páginas sem Layout Padronizado

Estas páginas não usam nenhum dos layouts acima (têm layouts customizados):
- `LoginScreen.tsx`
- `RegisterScreen.tsx`
- `ForbiddenScreen.tsx`
- `MemberLimitReachedScreen.tsx`
- `SubscriptionSuccessScreen.tsx`
- Páginas em `onboarding/` (fluxo específico de onboarding)

---

## Referências

- Código fonte dos layouts: `mobile/src/components/layouts/`
- Componente base `PageHeader`: `mobile/src/components/PageHeader.tsx`
- Componente base `GlassBackground`: `mobile/src/components/GlassBackground.tsx`
- Tema e cores: `mobile/src/theme/colors.ts`

---

**Última atualização:** 2024-12-19

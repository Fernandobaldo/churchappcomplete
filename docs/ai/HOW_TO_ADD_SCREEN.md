# How to Add a New Screen — Templates e Guia

## Visão Geral

Este guia fornece templates prontos para criar novas telas seguindo os padrões do projeto.

## Decisão: Qual Layout Usar?

Antes de criar uma tela, decida qual layout usar:

- **ViewScreenLayout**: Listas, dashboards, visualização de dados
- **DetailScreenLayout**: Detalhes de um item único
- **FormScreenLayout**: Formulários de criação/edição

## Template 1: Tela de Lista (ViewScreenLayout)

### Uso
Listas de itens, dashboards, telas de visualização.

### Template Completo

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FlatList, View } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import api from '../api/api'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import { EmptyState } from '../components/states'
import { useBackToDashboard } from '../hooks/useBackToDashboard'

// 1. Definir tipo do item
interface MyItem {
  id: string
  name: string
  // ... mais campos
}

export default function MyListScreen() {
  const navigation = useNavigation()
  
  // 2. Estados
  const [items, setItems] = useState<MyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const ITEMS_PER_PAGE = 10

  // 3. Intercepta gesto de voltar
  useBackToDashboard()

  // 4. Função de fetch
  const fetchItems = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/my-items')
      const data: MyItem[] = res.data || []
      setItems(data)
    } catch (err: any) {
      console.error('Erro ao carregar itens:', err)
      setError(err.response?.data?.message || 'Erro ao carregar itens')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 5. Carregar inicial
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // 6. Recarregar ao voltar
  useFocusEffect(
    useCallback(() => {
      if (!loading && !refreshing) {
        fetchItems()
      }
    }, [fetchItems, loading, refreshing])
  )

  // 7. Handler de refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchItems()
  }, [fetchItems])

  // 8. Handler de retry
  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchItems().finally(() => setLoading(false))
  }, [fetchItems])

  // 9. Paginação (opcional)
  const paginatedItems = useMemo(() => 
    items.slice(0, page * ITEMS_PER_PAGE),
    [items, page]
  )

  const loadMore = useCallback(() => {
    if (!loadingMore && paginatedItems.length < items.length) {
      setLoadingMore(true)
      setTimeout(() => {
        setPage(prev => prev + 1)
        setLoadingMore(false)
      }, 300)
    }
  }, [loadingMore, paginatedItems.length, items.length])

  // 10. Estado empty
  const isEmpty = !loading && items.length === 0 && !error

  // 11. Render
  return (
    <ViewScreenLayout
      headerProps={{
        title: "Meus Itens",
        Icon: FontAwesome5,
        iconName: "list",
        rightButtonIcon: <FontAwesome5 name="plus" size={20} color="white" />,
        onRightButtonPress: () => navigation.navigate('AddMyItem'),
      }}
      scrollable={false}  // Para FlatList
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyTitle="Nenhum item encontrado"
      emptySubtitle="Adicione um novo item para começar"
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      <FlatList
        data={paginatedItems}
        renderItem={({ item }) => (
          <MyItemCard item={item} />
        )}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator /> : null
        }
      />
    </ViewScreenLayout>
  )
}
```

### Checklist

- [ ] Definir tipo do item (interface)
- [ ] Criar estados (items, loading, error, refreshing)
- [ ] Implementar fetchItems
- [ ] Adicionar useEffect para carregar inicial
- [ ] Adicionar useFocusEffect para recarregar ao voltar
- [ ] Implementar handleRefresh
- [ ] Implementar handleRetry
- [ ] Calcular isEmpty
- [ ] Usar ViewScreenLayout com scrollable={false}
- [ ] Passar estados para layout
- [ ] Criar FlatList com renderItem

## Template 2: Tela de Lista com Tabs

### Uso
Listas que precisam de filtros por tabs (ex: próximos/passados, lidos/não lidos).

### Template Completo

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FlatList } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import api from '../api/api'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import Tabs from '../components/Tabs'
import { EmptyState } from '../components/states'
import { useBackToDashboard } from '../hooks/useBackToDashboard'

interface MyItem {
  id: string
  name: string
  date: string
  // ... mais campos
}

export default function MyListWithTabsScreen() {
  const navigation = useNavigation()
  
  // 1. Estados
  const [tab, setTab] = useState<'tab1' | 'tab2'>('tab1')
  const [allItems, setAllItems] = useState<MyItem[]>([])  // ← TODOS os dados
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useBackToDashboard()

  // 2. Fetch (busca TODOS os dados)
  const fetchItems = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/my-items')
      const data: MyItem[] = res.data || []
      setAllItems(data)  // ← Salva TODOS
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar itens')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useFocusEffect(
    useCallback(() => {
      if (!loading && !refreshing) {
        fetchItems()
      }
    }, [fetchItems, loading, refreshing])
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchItems()
  }, [fetchItems])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchItems().finally(() => setLoading(false))
  }, [fetchItems])

  // 3. Filtrar baseado na tab (client-side)
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Lógica de filtro baseada na tab
      if (tab === 'tab1') {
        return item.status === 'active'
      } else {
        return item.status === 'inactive'
      }
    })
  }, [allItems, tab])

  // 4. Estados empty
  const isGlobalEmpty = !loading && allItems.length === 0 && !error  // ← TODOS os dados
  const isTabEmpty = !loading && filteredItems.length === 0 && allItems.length > 0  // ← Tab específico

  // 5. Tabs config
  const tabs = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
  ]

  return (
    <ViewScreenLayout
      headerProps={{
        title: "Meus Itens",
        Icon: FontAwesome5,
        iconName: "list",
      }}
      scrollable={false}
      loading={loading}
      error={error}
      empty={isGlobalEmpty}  // ← Empty GLOBAL
      emptyTitle="Nenhum item encontrado"
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <MyItemCard item={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isTabEmpty ? (
            <EmptyState title="Nenhum item nesta categoria" />
          ) : null
        }
      />
    </ViewScreenLayout>
  )
}
```

### Checklist

- [ ] Criar `allItems` (todos os dados)
- [ ] Criar `filteredItems` (filtrado por tab)
- [ ] `isGlobalEmpty` baseado em `allItems`
- [ ] `isTabEmpty` baseado em `filteredItems`
- [ ] Passar `empty={isGlobalEmpty}` para layout
- [ ] Usar `ListEmptyComponent` para empty de tab
- [ ] Tabs sempre visíveis (não desaparecem)

## Template 3: Tela de Detalhe (DetailScreenLayout)

### Uso
Detalhes de um item único (evento, membro, transação, perfil).

### Template Completo

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import { useAuthStore } from '../stores/authStore'

interface MyItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  // ... mais campos
}

export default function MyItemDetailsScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  const { user } = useAuthStore()

  // 1. Estados
  const [item, setItem] = useState<MyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 2. Fetch
  const fetchItem = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get(`/my-items/${id}`)
      setItem(res.data)
    } catch (err: any) {
      console.error('Erro ao carregar item:', err)
      const errorMessage = err.response?.data?.message || 'Não foi possível carregar o item.'
      setError(errorMessage)
      setItem(null)  // ← Importante: setar null em erro
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  // 3. Recarregar ao voltar
  useFocusEffect(
    useCallback(() => {
      if (!loading && !refreshing) {
        fetchItem()
      }
    }, [fetchItem, loading, refreshing])
  )

  // 4. Handlers
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchItem()
  }, [fetchItem])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchItem().finally(() => setLoading(false))
  }, [fetchItem])

  // 5. Estado empty
  const isEmpty = !loading && !item && !error

  // 6. Permissões (opcional)
  const hasPermissionToEdit =
    user?.role === 'ADMINGERAL' ||
    user?.role === 'ADMINFILIAL' ||
    user?.permissions?.some((p: any) => p.type === 'my_items_manage')

  // 7. Banner image URL (se necessário)
  const bannerImageUrl = item?.imageUrl ? (() => {
    const imageUrl = item.imageUrl
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    } else {
      const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
      return `${api.defaults.baseURL}/${cleanUrl}`
    }
  })() : undefined

  // 8. Render
  return (
    <DetailScreenLayout
      headerProps={{
        title: "Detalhes do Item",
        Icon: FontAwesome5,
        iconName: "info-circle",
        rightButtonIcon: hasPermissionToEdit && item ? (
          <Ionicons name="create-outline" size={24} color="white" />
        ) : undefined,
        onRightButtonPress: hasPermissionToEdit && item
          ? () => navigation.navigate('EditMyItem', { id: item.id })
          : undefined,
      }}
      imageUrl={bannerImageUrl}
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyTitle="Item não encontrado"
      emptySubtitle="O item solicitado não existe ou foi removido"
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      {item && (  // ← IMPORTANTE: Envolver conteúdo
        <>
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20}>
            <Text style={styles.title}>{item.name}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
            {/* ... mais conteúdo ... */}
          </GlassCard>
        </>
      )}
    </DetailScreenLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
})
```

### Checklist

- [ ] Receber `id` via route.params
- [ ] Criar estados (item, loading, error, refreshing)
- [ ] Implementar fetchItem
- [ ] Adicionar useFocusEffect
- [ ] Implementar handlers (refresh, retry)
- [ ] Calcular isEmpty
- [ ] Envolver conteúdo em `{item && (...)}`
- [ ] Processar bannerImageUrl se necessário
- [ ] NÃO criar ScrollView manualmente

## Template 4: Tela de Formulário - Criar (FormScreenLayout)

### Uso
Formulários de criação (Add screens).

### Template Completo

```tsx
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent, { Field } from '../components/FormsComponent'
import api from '../api/api'

export default function AddMyItemScreen() {
  const navigation = useNavigation()

  // 1. Estado do formulário
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    // ... mais campos
  })

  // 2. Estados de submit
  const [submitting, setSubmitting] = useState(false)

  // 3. Campos do formulário
  const fields: Field[] = [
    {
      key: 'name',
      label: 'Nome',
      type: 'string',
      required: true,
      placeholder: 'Digite o nome',
    },
    {
      key: 'description',
      label: 'Descrição',
      type: 'string',
      placeholder: 'Digite a descrição',
    },
    {
      key: 'date',
      label: 'Data',
      type: 'date',
      required: true,
      placeholder: 'DD/MM/AAAA',
    },
    // ... mais campos
  ]

  // 4. Handler de submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      // Validação adicional (se necessário)
      if (!form.name) {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Nome é obrigatório',
        })
        return
      }

      // Upload de imagem (se necessário)
      let imageUrl = form.imageUrl
      if (imageUrl && imageUrl.startsWith('file://')) {
        // Fazer upload da imagem
        const formData = new FormData()
        formData.append('image', {
          uri: imageUrl,
          type: 'image/jpeg',
          name: 'image.jpg',
        } as any)
        
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = uploadRes.data.url
      }

      // Enviar dados
      await api.post('/my-items', {
        ...form,
        imageUrl,
      })

      navigation.goBack()
      Toast.show({
        type: 'success',
        text1: 'Sucesso!',
        text2: 'Item criado com sucesso',
      })
    } catch (err: any) {
      console.error('Erro ao criar item:', err)
      const errorMessage = err.response?.data?.message || 'Erro ao criar item'
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 5. Render
  return (
    <FormScreenLayout
      headerProps={{
        title: "Criar Item",
        Icon: FontAwesome5,
        iconName: "plus",
      }}
    >
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Criar"
      />
    </FormScreenLayout>
  )
}
```

### Checklist

- [ ] Criar estado do formulário
- [ ] Definir campos (Field[])
- [ ] Implementar handleSubmit
- [ ] Validação adicional (se necessário)
- [ ] Upload de imagem (se necessário)
- [ ] Toast de sucesso/erro
- [ ] NÃO criar ScrollView manualmente

## Template 5: Tela de Formulário - Editar (FormScreenLayout)

### Uso
Formulários de edição (Edit screens).

### Template Completo

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent, { Field } from '../components/FormsComponent'
import api from '../api/api'

interface MyItem {
  id: string
  name: string
  description?: string
  date: string
  // ... mais campos
}

export default function EditMyItemScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }

  // 1. Estados
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    // ... mais campos
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 2. Campos do formulário
  const fields: Field[] = [
    {
      key: 'name',
      label: 'Nome',
      type: 'string',
      required: true,
    },
    // ... mais campos
  ]

  // 3. Fetch inicial
  const fetchItem = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get(`/my-items/${id}`)
      const item: MyItem = res.data

      // Preencher formulário
      setForm({
        name: item.name || '',
        description: item.description || '',
        date: item.date || '',
        // ... mais campos
      })
    } catch (err: any) {
      console.error('Erro ao carregar item:', err)
      const errorMessage = err.response?.data?.message || 'Erro ao carregar item'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  // 4. Handler de retry
  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchItem().finally(() => setLoading(false))
  }, [fetchItem])

  // 5. Handler de submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      // Validação
      if (!form.name) {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Nome é obrigatório',
        })
        return
      }

      // Upload de imagem (se necessário)
      let imageUrl = form.imageUrl
      if (imageUrl && imageUrl.startsWith('file://')) {
        // ... upload logic
      }

      // Atualizar
      await api.put(`/my-items/${id}`, {
        ...form,
        imageUrl,
      })

      navigation.goBack()
      Toast.show({
        type: 'success',
        text1: 'Sucesso!',
        text2: 'Item atualizado com sucesso',
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar item'
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 6. Render
  return (
    <FormScreenLayout
      headerProps={{
        title: "Editar Item",
        Icon: FontAwesome5,
        iconName: "edit",
      }}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    >
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Salvar"
      />
    </FormScreenLayout>
  )
}
```

### Checklist

- [ ] Receber `id` via route.params
- [ ] Criar estados (form, loading, error, submitting)
- [ ] Implementar fetchItem para carregar dados iniciais
- [ ] Preencher formulário com dados carregados
- [ ] Implementar handleRetry
- [ ] Implementar handleSubmit (PUT)
- [ ] Passar loading/error para layout
- [ ] NÃO criar ScrollView manualmente

## Checklist Geral para Nova Tela

### Antes de Começar

- [ ] Decidir qual layout usar (View/Detail/Form)
- [ ] Verificar se service existe ou criar novo
- [ ] Verificar se hooks existem ou criar novos
- [ ] Planejar estrutura de dados

### Durante o Desenvolvimento

- [ ] Usar template apropriado
- [ ] Seguir padrões de estado (loading, error, empty)
- [ ] Implementar useFocusEffect se necessário
- [ ] Tratar erros adequadamente
- [ ] Usar TypeScript em tudo

### Depois de Criar

- [ ] Adicionar rota no AppNavigator
- [ ] Testar navegação
- [ ] Testar estados (loading, error, empty)
- [ ] Testar pull-to-refresh (se aplicável)
- [ ] Verificar se TypeScript compila
- [ ] Testar em dispositivo/emulador

## Exemplos de Navegação

### Adicionar Rota no AppNavigator

```tsx
// navigation/AppNavigator.tsx
<Stack.Screen
  name="MyListScreen"
  component={MyListScreen}
/>
<Stack.Screen
  name="MyItemDetails"
  component={MyItemDetailsScreen}
/>
<Stack.Screen
  name="AddMyItem"
  component={AddMyItemScreen}
/>
<Stack.Screen
  name="EditMyItem"
  component={EditMyItemScreen}
/>
```

### Navegar para Nova Tela

```tsx
// De lista para detalhe
navigation.navigate('MyItemDetails', { id: item.id })

// De lista para criar
navigation.navigate('AddMyItem')

// De detalhe para editar
navigation.navigate('EditMyItem', { id: item.id })
```

---

**Última atualização:** 2024-12-19


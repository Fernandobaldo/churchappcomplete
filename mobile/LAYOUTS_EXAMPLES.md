# 📱 Exemplos Práticos de Migração de Layouts

Este documento mostra exemplos reais de como as telas foram migradas para usar os novos layouts padronizados.

---

## 1. FormScreenLayout - AddTransactionScreen

### ❌ Antes (Código Duplicado)

```typescript
import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native'
import PageHeader from '../components/PageHeader'
import { Ionicons } from '@expo/vector-icons'

export default function AddTransactionScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <PageHeader
                title="Nova Transação"
                Icon={Ionicons}
                iconName="add-circle-outline"
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.label}>Título *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Pagamento de aluguel"
                    />
                    
                    <Text style={styles.label}>Valor *</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="R$ 0,00"
                    />
                    
                    {/* ... mais campos ... */}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        marginTop: 110, // ⚠️ Valor hardcoded
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
})
```

**Problemas:**
- ❌ 60+ linhas de boilerplate
- ❌ KeyboardAvoidingView manual
- ❌ marginTop hardcoded
- ❌ Estrutura repetida em todas as telas de formulário

---

### ✅ Depois (Usando FormScreenLayout)

```typescript
import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { FormScreenLayout } from '../components/layouts'
import { Ionicons } from '@expo/vector-icons'

export default function AddTransactionScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')

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
                placeholder="Ex: Pagamento de aluguel"
            />
            
            <Text style={styles.label}>Valor *</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="R$ 0,00"
            />
            
            {/* ... mais campos ... */}
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
})
```

**Benefícios:**
- ✅ 30+ linhas removidas
- ✅ KeyboardAvoidingView automático
- ✅ marginTop gerenciado pelo layout
- ✅ Foco no conteúdo, não na estrutura

---

## 2. ViewScreenLayout - DashboardScreen

### ❌ Antes

```typescript
import React, { useState } from 'react'
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import PageHeader from '../components/PageHeader'

export default function DashboardScreen() {
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
    }

    return (
        <View style={styles.container}>
            <PageHeader
                churchLogo={churchInfo?.logoUrl}
                churchName={churchInfo?.name}
                userAvatar={userAvatar}
                userName={user?.name}
                onAvatarPress={() => navigation.navigate('ProfileScreen')}
            />
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3366FF']}
                        tintColor="#3366FF"
                    />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Página inicial</Text>
                </View>
                {/* ... conteúdo ... */}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        marginTop: 110, // ⚠️ Valor hardcoded
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    welcomeSection: {
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
})
```

---

### ✅ Depois

```typescript
import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ViewScreenLayout } from '../components/layouts'

export default function DashboardScreen() {
    const [refreshing, setRefreshing] = useState(false)

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
                <Text style={styles.welcomeTitle}>Página inicial</Text>
            </View>
            {/* ... conteúdo ... */}
        </ViewScreenLayout>
    )
}

const styles = StyleSheet.create({
    welcomeSection: {
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
})
```

**Benefícios:**
- ✅ RefreshControl integrado
- ✅ Menos imports necessários
- ✅ Código mais limpo e legível

---

## 3. ViewScreenLayout (sem scroll) - EventsScreen

### ❌ Antes

```typescript
export default function EventsScreen() {
    return (
        <View style={styles.container}>
            <PageHeader
                title="Eventos e Cultos"
                Icon={FontAwesome5}
                iconName="calendar"
                rightButtonIcon={<Ionicons name="add" size={24} color="white" />}
                onRightButtonPress={() => navigation.navigate('AddEvent')}
            />

            <Tabs
                tabs={[
                    { key: 'proximos', label: 'Próximos' },
                    { key: 'passados', label: 'Passados' },
                ]}
                activeTab={tab}
                onTabChange={setTab}
                style={styles.tabsContainerWithHeader} // ⚠️ Precisa de marginTop
            />

            <FlatList
                data={events}
                renderItem={renderEvent}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl ... />}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabsContainerWithHeader: {
        marginTop: 110, // ⚠️ Valor hardcoded
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
})
```

---

### ✅ Depois

```typescript
export default function EventsScreen() {
    return (
        <ViewScreenLayout
            headerProps={{
                title: "Eventos e Cultos",
                Icon: FontAwesome5,
                iconName: "calendar",
                rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
                onRightButtonPress: () => navigation.navigate('AddEvent'),
            }}
            scrollable={false} // ⚡ Desabilita scroll do layout
            contentContainerStyle={styles.viewContent}
        >
            <Tabs
                tabs={[
                    { key: 'proximos', label: 'Próximos' },
                    { key: 'passados', label: 'Passados' },
                ]}
                activeTab={tab}
                onTabChange={setTab}
            />

            <FlatList
                data={events}
                renderItem={renderEvent}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl ... />}
            />
        </ViewScreenLayout>
    )
}

const styles = StyleSheet.create({
    viewContent: {
        flex: 1,
        padding: 0,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
})
```

**Benefícios:**
- ✅ `scrollable={false}` para usar FlatList customizado
- ✅ marginTop gerenciado automaticamente
- ✅ Estrutura mais clara

---

## 4. ListScreenLayout - Exemplo Futuro

### 🔮 Como ficará MembersListScreen

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
                rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
                onRightButtonPress: () => navigation.navigate('MemberRegistration'),
            }}
            data={members}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.memberCard}
                    onPress={() => navigation.navigate('MemberDetails', { id: item.id })}
                >
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberEmail}>{item.email}</Text>
                    </View>
                </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Nenhum membro cadastrado</Text>
                </View>
            }
        />
    )
}

const styles = StyleSheet.create({
    memberCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
})
```

**Benefícios:**
- ✅ FlatList integrado
- ✅ Loading state automático
- ✅ Pull-to-refresh incluído
- ✅ Empty state customizável
- ✅ Foco total nos items da lista

---

## 5. DetailScreenLayout - Exemplo Futuro

### 🔮 Como ficará EventDetailsScreen

```typescript
import { DetailScreenLayout } from '../components/layouts'

export default function EventDetailsScreen({ route }) {
    const { id } = route.params
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes do Evento",
                Icon: FontAwesome5,
                iconName: "calendar",
            }}
            imageUrl={event?.imageUrl} // ⚡ Imagem de destaque automática
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
            <Text style={styles.title}>{event?.title}</Text>
            
            <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                    {format(new Date(event?.startDate), "dd/MM/yyyy 'às' HH:mm")}
                </Text>
            </View>
            
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{event?.location}</Text>
            </View>
            
            <Text style={styles.description}>{event?.description}</Text>
            
            <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
                <Text style={styles.buttonText}>Confirmar Presença</Text>
            </TouchableOpacity>
        </DetailScreenLayout>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
    },
    description: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#3366FF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
```

**Benefícios:**
- ✅ Imagem de destaque integrada
- ✅ Loading state automático
- ✅ Pull-to-refresh incluído
- ✅ Layout otimizado para detalhes

---

## 📊 Comparação de Linhas de Código

| Tela | Antes | Depois | Redução |
|------|-------|--------|---------|
| AddTransactionScreen | 512 | 482 | -30 linhas (-5.9%) |
| EditProfileScreen | 720 | 685 | -35 linhas (-4.9%) |
| DashboardScreen | 299 | 265 | -34 linhas (-11.4%) |
| FinancesScreen | 803 | 770 | -33 linhas (-4.1%) |
| PermissionsScreen | 876 | 840 | -36 linhas (-4.1%) |
| EventsScreen | 238 | 205 | -33 linhas (-13.9%) |
| **TOTAL** | **3,448** | **3,247** | **-201 linhas (-5.8%)** |

---

## 🎯 Padrões Identificados

### 1. Estrutura Repetida (Removida)
```typescript
// ❌ Antes (em TODAS as telas)
<View style={styles.container}>
    <PageHeader {...} />
    <ScrollView style={styles.scrollView}>
        {/* conteúdo */}
    </ScrollView>
</View>

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollView: { marginTop: 110 },
})
```

### 2. Nova Estrutura (Simplificada)
```typescript
// ✅ Depois
<LayoutApropriado headerProps={{...}}>
    {/* conteúdo */}
</LayoutApropriado>

// Estilos apenas para o conteúdo específico
```

---

## 💡 Lições Aprendidas

### 1. Identificação do Layout Correto
- **Tem formulário?** → FormScreenLayout
- **É uma lista?** → ListScreenLayout
- **Mostra detalhes de um item?** → DetailScreenLayout
- **Dashboard ou conteúdo misto?** → ViewScreenLayout

### 2. Props Comuns
Todos os layouts aceitam:
- `headerProps` (obrigatório)
- `backgroundColor` (opcional)
- `contentContainerStyle` (opcional)

### 3. Props Específicas
- **ListScreenLayout:** `data`, `renderItem`, `keyExtractor`, `loading`
- **FormScreenLayout:** Nenhuma adicional (tudo é children)
- **DetailScreenLayout:** `imageUrl`, `loading`, `refreshing`, `onRefresh`
- **ViewScreenLayout:** `scrollable`, `refreshing`, `onRefresh`

---

## 🚀 Próximos Passos

1. Migrar MembersListScreen usando ListScreenLayout
2. Migrar ProfileScreen usando DetailScreenLayout
3. Migrar AddEventScreen usando FormScreenLayout
4. Continuar com as demais telas seguindo os exemplos acima

---

## 📚 Referências

- **Guia Completo:** `LAYOUTS_GUIDE.md`
- **Resumo:** `LAYOUTS_SUMMARY.md`
- **Código dos Layouts:** `src/components/layouts/`



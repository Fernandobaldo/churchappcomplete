import React, { useEffect, useState, useCallback } from 'react'
import {View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import Tabs from '../components/Tabs'
import PageHeader from '../components/PageHeader'


interface Event {
    id: string
    title: string
    startDate: string
    time?: string
    location?: string
}

export default function EventsScreen() {
    const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/events')
            const now = new Date()

            const data: Event[] = res.data || []
            const filtered = tab === 'proximos'
                ? data.filter((e: Event) => new Date(e.startDate) >= now)
                : data.filter((e: Event) => new Date(e.startDate) < now)

            // Só atualiza se os dados realmente mudarem
            setEvents((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
                    return filtered
                }
                return prev
            })
        } catch (error) {
            console.error('Erro ao carregar eventos:', error)
        }
    }, [tab])

    useEffect(() => {
        fetchEvents()
        const loadEvents = async () => {
            setLoading(true)
            await fetchEvents()
            setLoading(false)
        }
        loadEvents()
    }, [fetchEvents])

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchEvents()
        setRefreshing(false)
    }

    const canManageEvents =
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        user?.permissions?.some((p: any) => p.type === 'events_manage') || false

    return (
        <View style={styles.container}>
            <PageHeader
                title="Eventos e Cultos"
                Icon={FontAwesome5}
                iconName="calendar"
                rightButtonIcon={
                    canManageEvents ? (
                        <Ionicons name="add" size={24} color="white" />
                    ) : undefined
                }
                onRightButtonPress={
                    canManageEvents
                        ? () => (navigation as any).navigate('AddEvent')
                        : undefined
                }
            />

            <Tabs
                tabs={[
                    { key: 'proximos', label: 'Próximos' },
                    { key: 'passados', label: 'Passados' },
                ]}
                activeTab={tab}
                onTabChange={(key) => setTab(key as 'proximos' | 'passados')}
                style={styles.tabsContainerWithHeader}
            />

            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => (navigation as any).navigate('EventDetails', { id: item.id })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <View style={styles.eventInfo}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.eventDetail}>
                                {new Date(item.startDate).toLocaleDateString('pt-BR')} {item.time && `• ${item.time}`}
                            </Text>
                        </View>
                        {item.location && (
                            <View style={styles.eventInfo}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <Text style={styles.eventDetail}>{item.location}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            {tab === 'proximos' 
                                ? 'Nenhum evento próximo' 
                                : 'Nenhum evento passado'}
                        </Text>
                    </View>
                }
            />

            {canManageEvents && (
                <TouchableOpacity 
                    style={styles.fab} 
                    onPress={() => (navigation as any).navigate('AddEvent')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        marginTop: 0,
    },
    tabsContainerWithHeader: {
        marginTop: 110, // Altura do header fixo
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    eventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventDetail: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3366FF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
})

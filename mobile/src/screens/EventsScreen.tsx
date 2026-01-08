import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import Tabs from '../components/Tabs'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import { Event } from '../types'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import EmptyState from '../components/EmptyState'

export default function EventsScreen() {
    const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()

    const fetchEvents = useCallback(async () => {
        // Função para obter data/hora completa do evento considerando time
        const getEventDateTime = (event: Event): Date => {
            const startDate = new Date(event.startDate)
            
            // Se houver campo time, usa ele
            if (event.time && event.time.trim() !== '' && event.time !== '00:00') {
                const [hours, minutes] = event.time.split(':').map(Number)
                if (!isNaN(hours) && !isNaN(minutes)) {
                    startDate.setHours(hours, minutes, 0, 0)
                }
            } else {
                // Se não houver time ou for 00:00, mantém o horário do startDate
                // (já vem do backend com horário se foi definido)
            }
            
            return startDate
        }

        try {
            const res = await api.get('/events')
            const now = new Date()

            const data: Event[] = res.data || []
            const filtered = tab === 'proximos'
                ? data.filter((e: Event) => getEventDateTime(e) >= now)
                : data.filter((e: Event) => getEventDateTime(e) < now)

            // Ordena os eventos considerando data e horário
            const sorted = filtered.sort((a: Event, b: Event) => {
                const dateA = getEventDateTime(a)
                const dateB = getEventDateTime(b)
                
                if (tab === 'proximos') {
                    // Próximos: do mais próximo para o mais distante (crescente)
                    return dateA.getTime() - dateB.getTime()
                } else {
                    // Passados: do mais recente para o mais antigo (decrescente)
                    return dateB.getTime() - dateA.getTime()
                }
            })

            // Só atualiza se os dados realmente mudarem
            setEvents((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(sorted)) {
                    return sorted
                }
                return prev
            })
        } catch (error) {
            console.error('Erro ao carregar eventos:', error)
        }
    }, [tab])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        setPage(1)
        await fetchEvents()
        setRefreshing(false)
    }, [fetchEvents])
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedEvents = useMemo(() => 
        events.slice(0, page * ITEMS_PER_PAGE),
        [events, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && paginatedEvents.length < events.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, paginatedEvents.length, events.length])
    
    // Reset paginação quando muda tab
    useEffect(() => {
        setPage(1)
    }, [tab])

    const canManageEvents = useMemo(() =>
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        user?.permissions?.some((p) => p.type === 'events_manage') || false,
        [user]
    )

    useEffect(() => {
        const loadEvents = async () => {
            setLoading(true)
            await fetchEvents()
            setLoading(false)
        }
        loadEvents()
    }, [fetchEvents])

    if (loading) {
        return (
            <ViewScreenLayout
                headerProps={{
                    title: "Eventos e Cultos",
                    Icon: FontAwesome5,
                    iconName: "calendar",
                    rightButtonIcon: canManageEvents ? <Ionicons name="add" size={24} color="white" /> : undefined,
                    onRightButtonPress: canManageEvents ? () => navigation.navigate('AddEvent' as never) : undefined,
                }}
                scrollable={false}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
                </View>
            </ViewScreenLayout>
        )
    }

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Eventos e Cultos",
                Icon: FontAwesome5,
                iconName: "calendar",
                rightButtonIcon: canManageEvents ? <Ionicons name="add" size={24} color="white" /> : undefined,
                onRightButtonPress: canManageEvents ? () => navigation.navigate('AddEvent' as never) : undefined,
            }}
            scrollable={false}
            contentContainerStyle={styles.viewContent}
        >
            <Tabs
                tabs={[
                    { key: 'proximos', label: 'Próximos' },
                    { key: 'passados', label: 'Passados' },
                ]}
                activeTab={tab}
                onTabChange={(key) => setTab(key as 'proximos' | 'passados')}
            />

            <FlatList
                data={paginatedEvents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={handleRefresh}
                        colors={colors.gradients.primary}
                        tintColor={colors.gradients.primary[1]}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={colors.gradients.primary[1]} />
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <GlassCard
                        onPress={() => navigation.navigate('EventDetails' as never, { id: item.id } as never)}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.card}
                    >
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <View style={styles.eventInfo}>
                            <Ionicons name="calendar-outline" size={18} color={colors.gradients.primary[1]} />
                            <Text style={styles.eventDetail}>
                                {new Date(item.startDate).toLocaleDateString('pt-BR')} {item.time && `• ${item.time}`}
                            </Text>
                        </View>
                        {item.location && (
                            <View style={styles.eventInfo}>
                                <Ionicons name="location-outline" size={18} color={colors.gradients.secondary[1]} />
                                <Text style={styles.eventDetail}>{item.location}</Text>
                            </View>
                        )}
                    </GlassCard>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-outline"
                        message={tab === 'proximos' 
                            ? 'Nenhum evento próximo' 
                            : 'Nenhum evento passado'}
                    />
                }
            />
        </ViewScreenLayout>
    )
}


const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    card: {
        padding: 20,
        marginBottom: 16,
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        color: '#0F172A',
        marginBottom: 16,
    },
    eventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventDetail: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
        marginLeft: 12,
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
})

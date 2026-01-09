import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {View, Text, FlatList, StyleSheet, ActivityIndicator} from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import { eventsService } from '../services/events.service'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import Tabs from '../components/Tabs'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import { Event } from '../types'
import { colors } from '../theme/colors'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import { EmptyState } from '../components/states'

export default function EventsScreen() {
    const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
    const [allEvents, setAllEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()

    // Função para obter data/hora completa do evento considerando time
    const getEventDateTime = useCallback((event: Event): Date => {
        const startDate = new Date(event.startDate)
        
        // Se houver campo time, usa ele
        if (event.time && event.time.trim() !== '' && event.time !== '00:00') {
            const [hours, minutes] = event.time.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
                startDate.setHours(hours, minutes, 0, 0)
            }
        }
        
        return startDate
    }, [])

    const fetchEvents = useCallback(async () => {
        try {
            const data = await eventsService.getAll()
            setAllEvents(data || [])
            setError(null)
        } catch (err: any) {
            console.error('Erro ao carregar eventos:', err)
            setError(err.response?.data?.message || 'Erro ao carregar eventos')
        }
    }, [])

    // Filtra eventos baseado na tab selecionada
    const events = useMemo(() => {
        const now = new Date()
        const filtered = tab === 'proximos'
            ? allEvents.filter((e: Event) => getEventDateTime(e) >= now)
            : allEvents.filter((e: Event) => getEventDateTime(e) < now)

        // Ordena os eventos considerando data e horário
        return filtered.sort((a: Event, b: Event) => {
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
    }, [allEvents, tab, getEventDateTime])

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

    // Recarrega quando a tela ganha foco (após voltar de criar/editar evento)
    useFocusEffect(
        useCallback(() => {
            // Evita requisições duplicadas se já estiver carregando ou refrescando
            if (!loading && !refreshing) {
                fetchEvents()
            }
        }, [fetchEvents, loading, refreshing])
    )

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchEvents().finally(() => setLoading(false))
    }, [fetchEvents])

    // Global empty: verifica se TODAS as tabs estão vazias
    const isGlobalEmpty = !loading && allEvents.length === 0 && !error
    // Tab empty: verifica se apenas a tab atual está vazia
    const isTabEmpty = !loading && events.length === 0 && !error && allEvents.length > 0

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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.viewContent}
            loading={loading}
            error={error}
            empty={isGlobalEmpty}
            emptyTitle="Nenhum evento encontrado"
            emptySubtitle="Quando houver eventos disponíveis, eles aparecerão aqui"
            onRetry={handleRetry}
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
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={colors.gradients.primary[1]} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    isTabEmpty ? (
                        <EmptyState
                            title={tab === 'proximos' ? 'Nenhum evento próximo' : 'Nenhum evento passado'}
                            subtitle="Quando houver eventos nesta categoria, eles aparecerão aqui"
                        />
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

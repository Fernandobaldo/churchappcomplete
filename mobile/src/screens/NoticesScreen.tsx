import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import PermissionGuard from '../components/PermissionGuard'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import Tabs from '../components/Tabs'
import { Notice } from '../types'
import { colors } from '../theme/colors'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import { EmptyState } from '../components/states'

export default function NoticesScreen() {
    const [notices, setNotices] = useState<Notice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const navigation = useNavigation()
    const { user } = useAuthStore()
    const ITEMS_PER_PAGE = 10
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()

    const fetchData = useCallback(async () => {
        try {
            setError(null)
            const res = await api.get<Notice[]>('/notices')
            setNotices(res.data || [])
        } catch (err: any) {
            console.error('Erro ao carregar avisos:', err)
            setError(err.response?.data?.message || 'Erro ao carregar avisos')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        const loadNotices = async () => {
            setLoading(true)
            await fetchData()
        }
        loadNotices()
    }, [fetchData])

    // Recarrega quando a tela ganha foco (após voltar de criar/editar aviso)
    useFocusEffect(
        useCallback(() => {
            // Evita requisições duplicadas se já estiver carregando ou refrescando
            if (!loading && !refreshing) {
                fetchData()
            }
        }, [fetchData, loading, refreshing])
    )

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        setPage(1)
        setHasMore(true)
        fetchData()
    }, [fetchData])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchData().finally(() => setLoading(false))
    }, [fetchData])

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.post(`/notices/${id}/read`)
            // Atualiza o estado local imediatamente para melhor UX
            setNotices(prevNotices =>
                prevNotices.map(notice =>
                    notice.id === id ? { ...notice, read: true } : notice
                )
            )
            Toast.show({ type: 'success', text1: 'Aviso marcado como lido' })
        } catch (error: unknown) {
            console.error('Erro ao marcar aviso como lido:', error)
            const apiError = error as { response?: { data?: { message?: string } } }
            Toast.show({ 
                type: 'error', 
                text1: 'Erro ao marcar aviso como lido',
                text2: apiError.response?.data?.message || 'Tente novamente'
            })
        }
    }, [])

    const canManageNotices = useMemo(() => hasAccess(user, 'notice_manage'), [user])
    
    const unreadCount = useMemo(() => notices.filter(n => !n.read).length, [notices])
    const filteredNotices = useMemo(() => 
        notices.filter(item => 
            activeTab === 'unread' ? !item.read : item.read
        ),
        [notices, activeTab]
    )
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedNotices = useMemo(() => 
        filteredNotices.slice(0, page * ITEMS_PER_PAGE),
        [filteredNotices, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && paginatedNotices.length < filteredNotices.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, hasMore, paginatedNotices.length, filteredNotices.length])
    
    // Reset paginação quando muda tab
    useEffect(() => {
        setPage(1)
        setHasMore(true)
    }, [activeTab])

    // Global empty: verifica se TODAS as tabs estão vazias
    const isGlobalEmpty = !loading && notices.length === 0 && !error
    // Tab empty: verifica se apenas a tab atual está vazia
    const isTabEmpty = !loading && filteredNotices.length === 0 && !error && notices.length > 0

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Avisos e Comunicados",
                Icon: FontAwesome5,
                iconName: "bell",
                rightButtonIcon:
                    canManageNotices ? (
                        <Ionicons name="add" size={24} color="white" />
                    ) : undefined,
                onRightButtonPress:
                    canManageNotices
                        ? () => navigation.navigate('AddNotice' as never)
                        : undefined,
            }}
            scrollable={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.viewContent}
            loading={loading}
            error={error}
            empty={isGlobalEmpty}
            emptyTitle="Nenhum aviso encontrado"
            emptySubtitle="Quando houver avisos disponíveis, eles aparecerão aqui"
            onRetry={handleRetry}
        >
            {/* Tabs */}
            <Tabs
                tabs={[
                    {
                        key: 'unread',
                        label: 'Não Lidos',
                        badge: unreadCount > 0 ? unreadCount : undefined,
                    },
                    {
                        key: 'read',
                        label: 'Lidos',
                    },
                ]}
                activeTab={activeTab}
                onTabChange={(key) => setActiveTab(key as 'unread' | 'read')}
            />

            <FlatList
                data={paginatedNotices}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
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
                            title={activeTab === 'unread' ? 'Nenhum aviso não lido' : 'Nenhum aviso lido'}
                            subtitle="Quando houver avisos nesta categoria, eles aparecerão aqui"
                        />
                    ) : null
                }
                renderItem={({ item }) => (
                    <GlassCard
                        onPress={() => {
                            if (!item.read) {
                                markAsRead(item.id)
                            }
                        }}
                        opacity={!item.read ? 0.45 : 0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={!item.read ? styles.cardUnread : styles.card}
                    >
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    {!item.read && <View style={styles.unreadIndicator} />}
                                    <Text style={[styles.noticeTitle, !item.read && styles.unreadTitle]}>
                                        {item.title}
                                    </Text>
                                </View>
                                {!item.read && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>Novo</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.noticeMessage}>{item.message}</Text>
                            <Text style={styles.date}>
                                {format(new Date(item.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </Text>
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
        paddingBottom: 100,
    },
    card: {
        padding: 20,
        marginBottom: 16,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.gradients.primary[1],
    },
    cardUnread: {
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.gradients.primary[1],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.gradients.primary[1],
        marginRight: 12,
    },
    noticeTitle: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    unreadBadge: {
        backgroundColor: colors.gradients.primary[1],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
    },
    noticeMessage: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
        marginBottom: 12,
    },
    date: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        color: '#64748B',
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
})

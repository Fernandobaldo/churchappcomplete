import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import Tabs from '../components/Tabs'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import EmptyState from '../components/EmptyState'

export default function ContributionsScreen() {
    const [allContributions, setAllContributions] = useState([])
    const [tab, setTab] = useState<'ativas' | 'desativadas'>('ativas')
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const fetchContributions = useCallback(async () => {
        try {
            const res = await api.get('/contributions')
            // Armazena todas as contribuições sem filtrar
            setAllContributions(res.data || [])
        } catch (error) {
            console.error('Erro ao carregar contribuições:', error)
        }
    }, [])

    // Filtra contribuições baseado na tab selecionada
    const contributions = useMemo(() => {
        return (allContributions || []).filter((c: any) => {
            if (tab === 'ativas') {
                // Contribuições ativas: isActive === true ou undefined/null (padrão do backend)
                if (c.isActive === undefined || c.isActive === null) {
                    return true
                }
                return c.isActive === true
            } else {
                // Contribuições desativadas: isActive === false explicitamente
                return c.isActive === false
            }
        })
    }, [allContributions, tab])

    useEffect(() => {
        const loadContributions = async () => {
            setLoading(true)
            await fetchContributions()
            setLoading(false)
        }
        loadContributions()
    }, [fetchContributions])

    // Quando a tab muda, reseta a paginação
    useEffect(() => {
        setPage(1)
    }, [tab])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        setPage(1)
        setLoadingMore(false)
        await fetchContributions()
        setRefreshing(false)
    }, [fetchContributions])
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedContributions = useMemo(() => 
        contributions.slice(0, page * ITEMS_PER_PAGE),
        [contributions, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && paginatedContributions.length < contributions.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, paginatedContributions.length, contributions.length])

    const canManageContributions =
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL' ||
        user.permissions?.some((p: any) => p.type === 'contributions_manage')

    if (loading) {
        return (
            <ViewScreenLayout
                headerProps={{
                    title: "Contribuir",
                    Icon: FontAwesome5,
                    iconName: "hand-holding-heart",
                }}
                scrollable={false}
            >
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
                </View>
            </ViewScreenLayout>
        )
    }

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Contribuir",
                Icon: FontAwesome5,
                iconName: "hand-holding-heart",
                rightButtonIcon: canManageContributions ? <Ionicons name="add" size={24} color="white" /> : undefined,
                onRightButtonPress: canManageContributions ? () => navigation.navigate('AddContributions') : undefined,
            }}
            scrollable={false}
            contentContainerStyle={styles.viewContent}
        >
            <Text style={styles.subtitle}>Escolha abaixo as oportunidades para contribuir:</Text>

            <Tabs
                tabs={[
                    { key: 'ativas', label: 'Ativas' },
                    { key: 'desativadas', label: 'Desativadas' },
                ]}
                activeTab={tab}
                onTabChange={(key) => setTab(key as 'ativas' | 'desativadas')}
            />

            <FlatList
                data={paginatedContributions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
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
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.card}
                    >
                        <View style={{ flex: 1 }}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>{item.title}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    item.isActive !== false ? styles.statusBadgeActive : styles.statusBadgeInactive
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        item.isActive !== false ? styles.statusTextActive : styles.statusTextInactive
                                    ]}>
                                        {item.isActive !== false ? 'Ativa' : 'Inativa'}
                                    </Text>
                                </View>
                            </View>
                            {item.description && (
                                <Text style={styles.description}>{item.description}</Text>
                            )}
                            {item.goal && (
                                <Text style={styles.goalText}>
                                    Meta: R$ {item.goal.toFixed(2).replace('.', ',')}
                                </Text>
                            )}
                            {item.raised !== undefined && (
                                <Text style={styles.raisedText}>
                                    Arrecadado: R$ {(item.raised || 0).toFixed(2).replace('.', ',')}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.contributeButton}
                            onPress={() => navigation.navigate('ContributionDetail', { contribution: item })}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={colors.gradients.secondary as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.contributeButtonGradient}
                            >
                                <Text style={styles.buttonText}>Contribuir</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </GlassCard>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="heart-outline"
                        message="Nenhuma contribuição encontrada 🙏"
                    />
                }
            />
        </ViewScreenLayout>
    )
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewContent: {
        flex: 1,
        padding: 0,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    subtitle: {
        padding: 20,
        paddingBottom: 12,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: colors.text.secondary,
    },
    card: {
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        color: colors.text.primary,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadgeActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: colors.status.success,
    },
    statusBadgeInactive: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: colors.status.error,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
    },
    statusTextActive: {
        color: colors.status.success,
    },
    statusTextInactive: {
        color: colors.status.error,
    },
    description: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: colors.text.secondary,
        marginTop: 4,
    },
    goalText: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        color: colors.gradients.primary[1],
        marginTop: 8,
    },
    raisedText: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        color: colors.status.success,
        marginTop: 4,
    },
    contributeButton: {
        marginLeft: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    contributeButtonGradient: {
        width: '100%',
        minHeight: 44,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
})

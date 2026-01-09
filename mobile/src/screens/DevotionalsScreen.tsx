import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { devotionalsService } from '../services/devotionals.service'
import DevotionalCard from '../components/DevotionalCard'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {useAuthStore} from "../stores/authStore";
import { colors } from '../theme/colors'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import Toast from 'react-native-toast-message'

export default function FeedDevotionalsScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()



    const [devotionals, setDevotionals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const fetchDevotionals = useCallback(async () => {
        try {
            setError(null)
            const data = await devotionalsService.getAll()
            setDevotionals(data || [])
        } catch (err: any) {
            console.error('Erro ao carregar devocionais:', err)
            setError(err.response?.data?.message || 'Erro ao carregar devocionais')
        }
    }, [])

    useEffect(() => {
        const loadDevotionals = async () => {
            setLoading(true)
            await fetchDevotionals()
            setLoading(false)
        }
        loadDevotionals()
    }, [fetchDevotionals])

    // Recarrega quando a tela ganha foco (após voltar de criar/editar devocional)
    useFocusEffect(
        useCallback(() => {
            // Evita requisições duplicadas se já estiver carregando ou refrescando
            if (!loading && !refreshing) {
                fetchDevotionals()
            }
        }, [fetchDevotionals, loading, refreshing])
    )

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        setPage(1)
        await fetchDevotionals()
        setRefreshing(false)
    }, [fetchDevotionals])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchDevotionals().finally(() => setLoading(false))
    }, [fetchDevotionals])
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedDevotionals = useMemo(() => 
        devotionals.slice(0, page * ITEMS_PER_PAGE),
        [devotionals, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && paginatedDevotionals.length < devotionals.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, paginatedDevotionals.length, devotionals.length])

    const canManageDevotionals =
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL' ||
        user.permissions?.some((p: any) => p.type === 'devotional_manage')

    const isEmpty = !loading && devotionals.length === 0 && !error

    const handleLike = useCallback(async (devotionalId: string, liked: boolean) => {
        try {
            if (liked) {
                await devotionalsService.like(devotionalId)
            } else {
                await devotionalsService.unlike(devotionalId)
            }
            // Recarregar lista para atualizar contadores
            await fetchDevotionals()
        } catch (error: any) {
            console.error('Erro ao curtir:', error.response?.data || error.message)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível curtir o devocional',
            })
            // Recarregar para reverter estado visual
            await fetchDevotionals()
        }
    }, [fetchDevotionals])

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Devocionais e Estudos",
                Icon: FontAwesome5,
                iconName: "bible",
                rightButtonIcon: canManageDevotionals ? <Ionicons name="add" size={24} color="white" /> : undefined,
                onRightButtonPress: canManageDevotionals ? () => navigation.navigate('AddDevotional') : undefined,
            }}
            scrollable={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.viewContent}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Nenhum devocional encontrado"
            emptySubtitle="Quando houver devocionais disponíveis, eles aparecerão aqui 🙏"
            onRetry={handleRetry}
        >
            <FlatList
                contentContainerStyle={styles.list}
                data={paginatedDevotionals}
                renderItem={({ item }) => (
                    <DevotionalCard devotional={item} onLike={handleLike} />
                )}
                keyExtractor={(item) => item.id}
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
        padding: 16, 
        paddingBottom: 100,
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
})

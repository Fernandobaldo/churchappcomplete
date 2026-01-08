import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import DevotionalCard from '../components/DevotionalCard'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {useAuthStore} from "../stores/authStore";
import { colors } from '../theme/colors'
import { useBackToDashboard } from '../hooks/useBackToDashboard'
import EmptyState from '../components/EmptyState'

export default function FeedDevotionalsScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()



    const [devotionals, setDevotionals] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const fetchDevotionals = async () => {
        try {
            const res = await api.get('/devotionals')
            setDevotionals(res.data)
        } catch (error) {
            console.error('Erro ao carregar devocionais:', error)
        }
    }

    useEffect(() => {
        const loadDevotionals = async () => {
            setLoading(true)
            await fetchDevotionals()
            setLoading(false)
        }
        loadDevotionals()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        setPage(1)
        await fetchDevotionals()
        setRefreshing(false)
    }
    
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
        >
            <FlatList
                contentContainerStyle={styles.list}
                data={paginatedDevotionals}
                renderItem={({ item }) => (
                    <DevotionalCard devotional={item} refreshDevotionals={fetchDevotionals} />
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
                ListEmptyComponent={
                    <EmptyState
                        icon="book-outline"
                        message="Nenhum devocional encontrado 🙏"
                    />
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

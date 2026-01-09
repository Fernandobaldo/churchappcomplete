// screens/MembersListScreen.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { membersService } from '../services/members.service'
import { Ionicons } from '@expo/vector-icons'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { colors } from '../theme/colors'


interface Member {
    id: string
    name: string
    email?: string
    role?: string
    avatarUrl?: string
    branchId?: string

}

export default function MembersListScreen() {
    const navigation = useNavigation()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10

    const fetchMembers = useCallback(async () => {
        try {
            setError(null)
            const data = await membersService.getAll()
            setMembers(data || [])
        } catch (err: any) {
            console.error('Erro ao buscar membros:', err)
            setError(err.response?.data?.message || 'Erro ao buscar membros')
        }
    }, [])

    useEffect(() => {
        const loadMembers = async () => {
            setLoading(true)
            await fetchMembers()
            setLoading(false)
        }
        loadMembers()
    }, [fetchMembers])

    // Recarrega quando a tela ganha foco (após voltar de criar/editar membro)
    useFocusEffect(
        useCallback(() => {
            // Evita requisições duplicadas se já estiver carregando ou refrescando
            if (!loading && !refreshing) {
                fetchMembers()
            }
        }, [fetchMembers, loading, refreshing])
    )

    const filteredMembers = useMemo(() => 
        members.filter((m) =>
            m.name.toLowerCase().includes(search.toLowerCase())
        ),
        [members, search]
    )
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedMembers = useMemo(() => 
        filteredMembers.slice(0, page * ITEMS_PER_PAGE),
        [filteredMembers, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && paginatedMembers.length < filteredMembers.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, paginatedMembers.length, filteredMembers.length])
    
    // Reset paginação quando muda busca
    useEffect(() => {
        setPage(1)
    }, [search])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        setPage(1)
        await fetchMembers()
        setRefreshing(false)
    }, [fetchMembers])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchMembers().finally(() => setLoading(false))
    }, [fetchMembers])

    const isEmpty = !loading && filteredMembers.length === 0 && !error

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Membros",
                Icon: FontAwesome5,
                iconName: "user",
                rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
                onRightButtonPress: () => (navigation as any).navigate('MemberRegistrationScreen'),
            }}
            scrollable={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.viewContent}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Nenhum membro encontrado"
            emptySubtitle={search ? 'Tente buscar com outro termo' : 'Quando houver membros cadastrados, eles aparecerão aqui'}
            onRetry={handleRetry}
        >
            <View style={styles.actionsContainer}>
                <GlassCard
                    onPress={() => navigation.navigate('InviteLinks' as never)}
                    opacity={0.4}
                    blurIntensity={20}
                    borderRadius={20}
                    style={styles.actionCard}
                >
                    <Ionicons name="link" size={20} color={colors.gradients.primary[1]} />
                    <Text style={styles.actionButtonText}>Links de Convite</Text>
                </GlassCard>
            </View>
            <View style={styles.searchContainer}>
                <TextInputField
                    fieldKey="search"
                    label=""
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar membros"
                />
            </View>

            <FlatList
                data={paginatedMembers}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
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
                renderItem={({ item }) => (
                    <GlassCard
                        onPress={() => (navigation as any).navigate('MemberDetails', { id: item.id })}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.memberCard}
                    >
                        <Image
                            source={{ uri: item.avatarUrl || 'https://via.placeholder.com/50' }}
                            style={styles.avatar}
                        />
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{item.name}</Text>
                            <Text style={styles.memberRole}>{item.role}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary}/>
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
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    actionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        color: colors.gradients.primary[1],
    },
    searchContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
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
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 4,
    },
    memberRole: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
})

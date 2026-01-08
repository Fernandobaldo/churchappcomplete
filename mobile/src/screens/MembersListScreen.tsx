// screens/MembersListScreen.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'
import { Ionicons } from '@expo/vector-icons'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { colors } from '../theme/colors'
import EmptyState from '../components/EmptyState'


interface Member {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
    branchId: string

}

export default function MembersListScreen() {
    const navigation = useNavigation()
    const [members, setMembers] = useState<Member[]>([])
    const [search, setSearch] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10


    useEffect(() => {
        async function fetchMembers() {
            try {
                const res = await api.get('/members')
                setMembers(res.data)
            } catch (err) {
                console.error('Erro ao buscar membros:', err)
            }
        }
        fetchMembers()
    }, [])

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

    const handleRefresh = async () => {
        setRefreshing(true)
        setPage(1)
        try {
            const res = await api.get('/members')
            setMembers(res.data)
        } catch (err) {
            console.error('Erro ao buscar membros:', err)
        }
        setRefreshing(false)
    }

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Membros",
                Icon: FontAwesome5,
                iconName: "user",
                rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
                onRightButtonPress: () => navigation.navigate('MemberRegistrationScreen'),
            }}
            scrollable={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.viewContent}
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
                ListEmptyComponent={
                    <EmptyState
                        icon="people-outline"
                        message="Nenhum membro encontrado"
                    />
                }
                renderItem={({ item }) => (
                    <GlassCard
                        onPress={() => navigation.navigate('MemberDetails' as never, { id: item.id } as never)}
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

import React, { useEffect, useState, useCallback } from 'react'
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { membersService } from '../services/members.service'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { colors } from '../theme/colors'

interface Member {
    id: string
    name: string
    role: string
}

export default function ManagePermissionsScreen() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const navigation = useNavigation()

    const fetchMembers = useCallback(async () => {
        try {
            setError(null)
            const data = await membersService.getAll()
            setMembers(data || [])
        } catch (err: any) {
            console.error('Erro ao carregar membros:', err)
            setError(err.response?.data?.message || 'Erro ao carregar membros')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    useFocusEffect(
        useCallback(() => {
            if (!loading && !refreshing) {
                fetchMembers()
            }
        }, [fetchMembers, loading, refreshing])
    )

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchMembers()
    }, [fetchMembers])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchMembers().finally(() => setLoading(false))
    }, [fetchMembers])

    const isEmpty = !loading && members.length === 0 && !error

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Selecionar Membro",
                Icon: FontAwesome5,
                iconName: "users",
            }}
            scrollable={false}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Nenhum membro encontrado"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onRetry={handleRetry}
        >
            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.member}
                        onPress={() => navigation.navigate('EditMemberPermissions', { member: item })}
                        activeOpacity={0.7}
                    >
                        <GlassCard opacity={0.3} blurIntensity={10} borderRadius={12} style={styles.memberCard}>
                            <Text style={styles.memberName}>{item.name}</Text>
                            <Text style={styles.memberRole}>{item.role}</Text>
                        </GlassCard>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
            />
        </ViewScreenLayout>
    )
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
    },
    member: {
        marginBottom: 12,
    },
    memberCard: {
        padding: 16,
    },
    memberName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: colors.text.primary,
        marginBottom: 4,
    },
    memberRole: {
        fontSize: 14,
        color: colors.text.secondary,
    },
})

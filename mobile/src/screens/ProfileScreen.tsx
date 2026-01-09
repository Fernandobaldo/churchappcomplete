import React, { useEffect, useState, useCallback, useMemo } from 'react'

import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'

import {useNavigation, useRoute} from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import { membersService } from '../services/members.service'
import { authService } from '../services/auth.service'

import { useAuthStore } from '../stores/authStore'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Profile } from '../types'
import { colors } from '../theme/colors'

export default function ProfileScreen() {
    const route = useRoute()
    const { memberId } = route.params as { memberId?: string } || {}
    const isOwnProfile = !memberId
    const [refreshing, setRefreshing] = useState(false)
    const user = useAuthStore((s) => s.user)


    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigation = useNavigation()

    const fetchProfile = useCallback(async () => {
        try {
            setError(null)
            if (isOwnProfile) {
                const data = await authService.getCurrentUser()
                setProfile(data as Profile)
            } else if (memberId) {
                const data = await membersService.getById(memberId)
                setProfile(data as Profile)
            } else {
                setError('Perfil não encontrado')
            }
        } catch (err: any) {
            console.error('Erro ao carregar perfil:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar o perfil.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [isOwnProfile, memberId])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await fetchProfile()
        setRefreshing(false)
    }, [fetchProfile])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchProfile().finally(() => setLoading(false))
    }, [fetchProfile])

    const isEmpty = !loading && !profile && !error

    // Função para formatar data de nascimento
    const formatBirthDate = useCallback((dateString: string | null | undefined): string => {
        if (!dateString) return ''
        
        // Se já está no formato dd/MM/yyyy do backend, converter para exibição
        if (dateString.includes('/')) {
            try {
                // Backend retorna dd/MM/yyyy, precisa parsear corretamente
                const [day, month, year] = dateString.split('/')
                if (day && month && year) {
                    const date = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date())
                    if (isValid(date)) {
                        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    }
                }
                // Se não conseguir parsear, retorna como está
                return dateString
            } catch (e) {
                // Se falhar, tenta formatar como ISO
                try {
                    const date = new Date(dateString)
                    if (isValid(date)) {
                        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    }
                } catch (e2) {
                    return dateString
                }
            }
        }
        
        // Se está no formato ISO
        try {
            const date = new Date(dateString)
            if (isValid(date)) {
                return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            }
        } catch (e) {
            return dateString
        }
        
        return dateString
    }, [])

    const canManagePermissions = useMemo(() =>
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        user?.permissions?.some((p) => p.type === 'permission_manage'),
        [user]
    )

    const formatRole = useCallback((role: string) => {
        if (!role) return 'Nenhum'
        return role
            .replace('ADMINFILIAL', 'Admin Filial')
            .replace('ADMINGERAL', 'Admin Geral')
            .replace('COORDINATOR', 'Coordenador')
            .replace('MEMBER', 'Membro')
    }, [])

    const formatPermission = useCallback((permissions: { type: string }[] = []) => {
        if (!permissions || !Array.isArray(permissions)) return 'Nenhuma'

        return Array.from(new Set(permissions.map((p) => p.type)))
            .map((type) =>
                type
                    .replace('events_manage', 'Editar eventos')
                    .replace('contributions_manage', 'Editar contribuição')
                    .replace('finances_manage', 'Editar finanças')
                    .replace('devotional_manage', 'Editar devocional')
                    .replace('members_view', 'Visualizar membros')
                    .replace('members_manage', 'Gerenciar membros')
            )
            .join(', ')
    }, [])

    return (
        <DetailScreenLayout
            headerProps={{
                title: memberId ? 'Perfil do Membro' : 'Meu Perfil',
                Icon: FontAwesome5,
                iconName: "user",
                rightButtonIcon: !memberId && profile ? (
                    <Ionicons name="settings-outline" size={24} color="white" />
                ) : undefined,
                onRightButtonPress: !memberId && profile
                    ? () => {
                        navigation.navigate('EditProfileScreen' as never)
                    }
                    : undefined,
            }}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Perfil não encontrado"
            emptySubtitle="O perfil solicitado não existe ou foi removido"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onRetry={handleRetry}
        >
            {profile && (
                <View style={styles.scrollContent}>
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                    {profile.avatarUrl && typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim().length > 0 ? (
                        <Image
                            source={{
                                uri: profile.avatarUrl.startsWith('http')
                                    ? profile.avatarUrl
                                    : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}${profile.avatarUrl}`,
                            }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>
                                {profile.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.name}>{profile.name}</Text>
                    {profile.email && <Text style={styles.email}>{profile.email}</Text>}

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{profile.email || 'Não informado'}</Text>
                    </View>
                    {profile.phone && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Telefone</Text>
                            <Text style={styles.value}>{profile.phone}</Text>
                        </View>
                    )}
                    {profile.address && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Endereço</Text>
                            <Text style={styles.value}>{profile.address}</Text>
                        </View>
                    )}
                    {profile.birthDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Data de Nascimento</Text>
                            <Text style={styles.value}>{formatBirthDate(profile.birthDate)}</Text>
                        </View>
                    )}
                    {profile.branch && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Congregação</Text>
                            <Text style={styles.value}>{profile.branch?.church?.name || 'Não informado'}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Cargo na Igreja</Text>
                        <Text style={styles.value}>{profile.position?.name || 'Nenhum'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nível de Acesso</Text>
                        <Text style={styles.value}>{formatRole(profile.role) || 'Nenhum'}</Text>
                    </View>
                    {(canManagePermissions || isOwnProfile) && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Permissões:</Text>
                            <Text style={styles.valuePermission}>
                                {formatPermission(profile.permissions) || 'Nenhum'}
                            </Text>
                        </View>
                    )}
                    {canManagePermissions && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate('Permissions' as never)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={colors.gradients.primary as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>Gerenciar Permissões</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </GlassCard>
            </View>
            )}
        </DetailScreenLayout>
    )
}




const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
    },
    card: {
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.gradients.primary[0],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: '600',
        lineHeight: 48,
        color: colors.gradients.primary[1],
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 28,
        color: '#0F172A',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: colors.glass.border,
        marginVertical: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
    valuePermission: {
        marginLeft: 50,
        textAlign: 'right',
        flexWrap: 'wrap',
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
    button: {
        marginTop: 20,
        borderRadius: 18,
        overflow: 'hidden',
        width: '100%',
    },
    buttonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
})

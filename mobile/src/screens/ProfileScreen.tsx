import React, { useEffect, useState } from 'react'

import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'

import {useNavigation, useRoute} from '@react-navigation/native'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'

import { useAuthStore } from '../stores/authStore'
import { format, parse, isValid } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

export default function ProfileScreen() {
    const route = useRoute()
    const { memberId } = route.params || {}
    const isOwnProfile = !memberId
    const [refreshing, setRefreshing] = useState(false)
    const user = useAuthStore((s) => s.user)


    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const navigation = useNavigation()

    const fetchProfile = async () => {
        try {
            setLoading(true)
            if (isOwnProfile) {
                const res = await api.get('/members/me')
                setProfile(res.data)
            } else {
                const res = await api.get(`/members/${memberId}`)
                setProfile(res.data)
            }
        } catch (err) {
            console.error('Erro ao carregar perfil:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [memberId])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchProfile()
        setRefreshing(false)
    }

    // Função para formatar data de nascimento
    const formatBirthDate = (dateString: string | null | undefined): string => {
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
    }


    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    const canManagePermissions =
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        user?.permissions?.some((p: any) => p.type === 'permission_manage')

    const formatRole = (role: string) => {
        if (!role) return 'Nenhum'
        return role
            .replace('ADMINFILIAL', 'Admin Filial')
            .replace('ADMINGERAL', 'Admin Geral')
            .replace('COORDINATOR', 'Coordenador')
            .replace('MEMBER', 'Membro')
    }

    const formatPermission = (permissions: { type: string }[] = []) => {
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
    }

    return (
        <DetailScreenLayout
            headerProps={{
                title: memberId ? 'Perfil do Membro' : 'Meu Perfil',
                Icon: FontAwesome5,
                iconName: "user",
                rightButtonIcon: !memberId ? (
                    <Ionicons name="settings-outline" size={24} color="white" />
                ) : undefined,
                onRightButtonPress: !memberId
                    ? () => {
                        navigation.navigate('EditProfileScreen' as never)
                    }
                    : undefined,
            }}
            backgroundColor="#f2f2f2"
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3366FF']}
                        tintColor="#3366FF"
                    />
                }
            >
                <View style={styles.card}>
                    {profile.avatarUrl && typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim().length > 0 ? (
                        <Image
                            source={{
                                uri: profile.avatarUrl.startsWith('http')
                                    ? profile.avatarUrl
                                    : `${api.defaults.baseURL}${profile.avatarUrl}`,
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
                        >
                            <Text style={styles.buttonText}>Gerenciar Permissões</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </DetailScreenLayout>
    )
}




const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
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
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: '600',
        color: '#3366FF',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#eee',
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
        color: '#444',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
    },
    valuePermission: {
        marginLeft: 50,
        textAlign: 'right',
        flexWrap: 'wrap',
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#3366FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
})

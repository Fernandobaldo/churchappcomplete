import React, { useEffect, useState } from 'react'

import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native'

import {useNavigation, useRoute} from '@react-navigation/native'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'

import { useAuthStore } from '../stores/authStore'

export default function ProfileScreen() {
    const route = useRoute()
    const { memberId } = route.params || {}
    const isOwnProfile = !memberId
    const [refreshing, setRefreshing] = useState(false)
    const user = useAuthStore((s) => s.user)


    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const navigation = useNavigation()

    useEffect(() => {
        async function fetchProfile() {
            try {
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
        fetchProfile()
    }, [memberId])
    // const handleRefresh = async () => {
    //     setRefreshing(true)
    //     await ProfileScreen()
    //     setRefreshing(false)
    // }


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
        <View style={styles.container}>
            <PageHeader
                title={memberId ? 'Perfil do Membro' : 'Meu Perfil'}
                Icon={FontAwesome5}
                iconName="user"
                rightButtonIcon={
                    !memberId ? <Ionicons name="settings-outline" size={24} color="white" /> : undefined
            }
                onRightButtonPress={() => {
                    navigation.navigate('EditProfileScreen')
                }}
            />
            <View style={styles.card}>
                <Image
                    source={{ uri: profile.avatarUrl || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                    defaultSource={require('../../assets/worshipImage.png')} //
                />
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.birthDate}</Text>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Congregação</Text>
                    <Text style={styles.value}>{profile.branch.church?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Cargo</Text>
                    <Text style={styles.value}> {formatRole(profile.role) || 'Nenhum'}</Text>
                </View>
                {canManagePermissions && (
                <View style={styles.infoRow}>
                <Text style={styles.label}>Permissões:</Text>
                <Text style={styles.valuePermission}> {formatPermission(profile.permissions) || 'Nenhum'}
                </Text>
                </View>
                )}
                {/*refreshing={refreshing}*/}
                {/*onRefresh={handleRefresh}*/}
                {canManagePermissions && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('EditMemberPermissions', { memberId: profile.id })}
                    >
                        <Text style={styles.buttonText}>Gerenciar Permissões</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',

    },
    card: {
        marginTop: 50,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
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

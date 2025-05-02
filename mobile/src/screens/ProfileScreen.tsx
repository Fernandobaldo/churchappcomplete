import React, { useEffect, useState } from 'react'

import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'

export default function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const navigation = useNavigation()

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/members/me')
                setProfile(res.data)
            } catch (error) {
                console.error('Erro ao carregar perfil:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    const canManagePermissions =
        profile.role === 'ADMINGERAL' ||
        profile.role === 'ADMINFILIAL' ||
        profile.permissions?.some((p: any) => p.type === 'members_manage')

    return (
        <View style={styles.container}>
            <PageHeader
                title="Meu Perfil"
                Icon={FontAwesome5}
                iconName="user"
                rightButtonIcon={<Ionicons name="settings-outline" size={24} color="white" />}
                onRightButtonPress={() => {
                    console.log('Abrir configurações')
                }}
            />
            <View style={styles.card}>
                <Image
                    source={{ uri: 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.email}</Text>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Congregação</Text>
                    <Text style={styles.value}>{profile.church?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Cargo</Text>
                    <Text style={styles.value}>{formatRole(profile.role)}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Permissões:</Text>
                <Text style={styles.valuePermission}>
                    {formatPermission(profile.permissions?.map((p: any) => p.type).join(', ') )|| 'Nenhuma'}
                </Text>
                </View>

                {canManagePermissions && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ManagePermissions', { memberId: profile.id })}
                    >
                        <Text style={styles.buttonText}>Gerenciar Permissões</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

function formatRole(role: string) {
    return role.replace('ADMINFILIAL', 'AdminFilial')
        .replace('ADMINGERAL', 'AdminGeral')
        .replace('COORDINATOR', 'Coordenador')
        .replace('MEMBER', 'Membro')
}

function formatPermission(permission: string) {
    return permission.replace('members_view', 'Ver membros')
        .replace('events_manage', 'Editar eventos')
        .replace('contribution_manage', 'Editar contribuição')
        .replace('finances_manage', 'Editar finanças')
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
        marginLeft: 100,
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

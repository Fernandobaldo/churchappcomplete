import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'

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
            <View style={styles.header}>
                <FontAwesome5 name="user-circle" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.headerTitle}>Meu Perfil</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Nome:</Text>
                <Text style={styles.value}>{profile.name}</Text>

                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile.email}</Text>

                <Text style={styles.label}>Cargo:</Text>
                <Text style={styles.value}>{profile.role}</Text>

                <Text style={styles.label}>Igreja:</Text>
                <Text style={styles.value}>{profile.branch?.name}</Text>

                <Text style={styles.label}>Permissões:</Text>
                <Text style={styles.value}>
                    {profile.permissions?.map((p: any) => p.type).join(', ') || 'Nenhuma'}
                </Text>
            </View>

            {canManagePermissions && (
                <TouchableOpacity
                    style={styles.permissionBtn}
                    onPress={() => navigation.navigate('PermissionEditor', { userId: profile.id })}
                >
                    <Ionicons name="key-outline" size={20} color="white" />
                    <Text style={styles.permissionBtnText}>Gerenciar Permissões</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        backgroundColor: '#3366FF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    label: {
        fontWeight: 'bold',
        color: '#444',
        marginTop: 12,
    },
    value: {
        fontSize: 16,
        color: '#000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionBtn: {
        marginTop: 30,
        backgroundColor: '#3366FF',
        marginHorizontal: 20,
        padding: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    permissionBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
})

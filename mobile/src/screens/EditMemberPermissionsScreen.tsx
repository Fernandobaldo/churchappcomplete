// screens/EditMemberPermissionsScreen.tsx

import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Switch,
    ActivityIndicator,
    Alert,
    ScrollView,
    TouchableOpacity,
} from 'react-native'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Toast from 'react-native-toast-message'
import api from '../api/api'

const PERMISSIONS = [
    { key: 'finance_manage', label: 'Gerenciar Finanças' },
    { key: 'events_manage', label: 'Gerenciar Eventos' },
    { key: 'member_manage', label: 'Gerenciar Membros' },
    { key: 'devotional_manage', label: 'Gerenciar Devocionais' },
    { key: 'notice_manage', label: 'Gerenciar Avisos' },
    { key: 'contribution_manage', label: 'Gerenciar Contribuições' },
]

export default function EditMemberPermissionsScreen({ route, navigation }: any) {
    const { memberId } = route.params
    const [loading, setLoading] = useState(true)
    const [member, setMember] = useState<any>(null)
    const [permissions, setPermissions] = useState<string[]>([])

    useEffect(() => {
        async function fetchMember() {
            try {
                const res = await api.get(`/members/${memberId}`)
                setMember(res.data)
                setPermissions(res.data.permissions.map((p: any) => p.type))
            } catch (err) {
                Alert.alert('Erro ao carregar membro')
            } finally {
                setLoading(false)
            }
        }
        fetchMember()
    }, [memberId])

    const togglePermission = (key: string) => {
        setPermissions((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        )
    }

    const handleSave = async () => {
        try {
            await api.post(`/permissions/${memberId}`, { permissions })
            Toast.show({
                type: 'success',
                text1: 'Permissões atualizadas',
            })
            navigation.goBack()
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar permissões',
            })
        }
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title={`Permissões de ${member?.name}`}
                Icon={FontAwesome5}
                iconName="lock"
            />
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {PERMISSIONS.map((perm) => (
                    <View key={perm.key} style={styles.row}>
                        <Text style={styles.label}>{perm.label}</Text>
                        <Switch
                            value={permissions.includes(perm.key)}
                            onValueChange={() => togglePermission(perm.key)}
                        />
                    </View>
                ))}
                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Salvar Permissões</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    label: { fontSize: 16, color: '#333' },
    button: {
        backgroundColor: '#3366FF',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 24,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

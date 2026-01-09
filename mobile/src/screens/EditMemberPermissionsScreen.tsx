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
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Toast from 'react-native-toast-message'
import api from '../api/api'

const PERMISSIONS = [
    { key: 'finances_manage', label: 'Gerenciar Finanças' },
    { key: 'events_manage', label: 'Gerenciar Eventos' },
    { key: 'members_manage', label: 'Gerenciar Membros' },
    { key: 'devotional_manage', label: 'Gerenciar Devocionais' },
    { key: 'contributions_manage', label: 'Gerenciar Contribuições' },
    { key: 'church_manage', label: 'Gerenciar Igreja' },
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
        // Permissões restritas que requerem pelo menos role COORDINATOR
        const restrictedPermissions = ['finances_manage', 'church_manage', 'contributions_manage']
        const hasPermission = permissions.includes(key)
        
        // Se está tentando ativar uma permissão restrita e o membro tem role MEMBER
        if (!hasPermission && restrictedPermissions.includes(key) && member?.role === 'MEMBER') {
            Alert.alert(
                'Permissão Restrita',
                'Esta permissão requer pelo menos a role de Coordenador',
                [{ text: 'OK' }]
            )
            return
        }

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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={{ padding: 20 }}
                    style={styles.scrollView}
                    keyboardShouldPersistTaps="handled"
                >
                    {PERMISSIONS.map((perm) => {
                        const restrictedPermissions = ['finances_manage', 'church_manage', 'contributions_manage']
                        const isRestrictedPermission = restrictedPermissions.includes(perm.key)
                        const isMemberRole = member?.role === 'MEMBER'
                        const hasPermission = permissions.includes(perm.key)
                        const shouldDisableSwitch = isRestrictedPermission && isMemberRole && !hasPermission

                        return (
                            <View key={perm.key} style={styles.permissionContainer}>
                                <View style={styles.row}>
                                    <Text style={[styles.label, shouldDisableSwitch && styles.disabledLabel]}>
                                        {perm.label}
                                    </Text>
                                    <Switch
                                        value={hasPermission}
                                        onValueChange={() => togglePermission(perm.key)}
                                        disabled={shouldDisableSwitch}
                                    />
                                </View>
                                {shouldDisableSwitch && (
                                    <Text style={styles.alertText}>
                                        Esta permissão requer pelo menos a role de Coordenador
                                    </Text>
                                )}
                            </View>
                        )
                    })}
                    <TouchableOpacity style={styles.button} onPress={handleSave}>
                        <Text style={styles.buttonText}>Salvar Permissões</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        marginTop: 110, // Altura do header fixo
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    permissionContainer: {
        marginVertical: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: 16, color: '#333' },
    disabledLabel: {
        opacity: 0.6,
    },
    alertText: {
        fontSize: 12,
        color: '#856404',
        backgroundColor: '#fff3cd',
        padding: 8,
        borderRadius: 4,
        marginTop: 4,
    },
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

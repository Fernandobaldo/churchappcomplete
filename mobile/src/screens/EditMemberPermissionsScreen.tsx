import React, { useState } from 'react'
import { View, Text, Switch, Button, StyleSheet } from 'react-native'
import api from '../api/api'

const PERMISSIONS = [
    { key: 'finance_manage', label: 'Gerenciar Finanças' },
    { key: 'event_manage', label: 'Gerenciar Eventos' },
    { key: 'member_manage', label: 'Gerenciar Membros' },
    { key: 'devotional_manage', label: 'Gerenciar Devocionais' },
    { key: 'notice_manage', label: 'Gerenciar Avisos' },
]

export default function EditMemberPermissionsScreen({ route, navigation }: any) {
    const { member } = route.params
    const [permissions, setPermissions] = useState<string[]>(member.permissions.map((p: any) => p.type))

    const togglePermission = (key: string) => {
        if (permissions.includes(key)) {
            setPermissions(permissions.filter((p) => p !== key))
        } else {
            setPermissions([...permissions, key])
        }
    }

    const handleSave = async () => {
        await api.put(`/members/${member.id}/permissions`, { permissions })
        navigation.goBack()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Permissões de {member.name}</Text>
            {PERMISSIONS.map((perm) => (
                <View key={perm.key} style={styles.row}>
                    <Text>{perm.label}</Text>
                    <Switch
                        value={permissions.includes(perm.key)}
                        onValueChange={() => togglePermission(perm.key)}
                    />
                </View>
            ))}
            <Button title="Salvar Permissões" onPress={handleSave} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
})

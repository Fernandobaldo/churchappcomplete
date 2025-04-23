import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'

export default function ManagePermissionsScreen() {
    const [members, setMembers] = useState<any[]>([])
    const navigation = useNavigation()

    useEffect(() => {
        api.get('/members').then(res => setMembers(res.data))
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Selecionar Membro</Text>
            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.member}
                        onPress={() => navigation.navigate('EditMemberPermissions', { member: item })}
                    >
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberRole}>{item.role}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    member: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    memberName: { fontWeight: 'bold', fontSize: 16 },
    memberRole: { fontSize: 12, color: '#666' },
})

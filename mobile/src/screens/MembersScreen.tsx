import React, { useEffect, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import api from '../api/api'

export default function MembersScreen() {
    const [members, setMembers] = useState<any[]>([])

    useEffect(() => {
        api.get('/members').then((res) => {
            setMembers(res.data)
        })
    }, [])

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20 }}>Membros:</Text>
            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ paddingVertical: 10 }}>
                        <Text>{item.name} ({item.role})</Text>
                    </View>
                )}
            />
        </View>
    )
}

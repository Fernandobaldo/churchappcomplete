import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'

export default function ContributionsScreen() {
    const [contributions, setContributions] = useState<any[]>([])
    const navigation = useNavigation()

    useEffect(() => {
        api.get('/contributions').then(res => setContributions(res.data))
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Campanhas de Contribuição</Text>
            <FlatList
                data={contributions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('ContributionDetail', { id: item.id })}
                    >
                        <Text style={styles.event}>{item.title}</Text>
                        <Text style={styles.reason}>{item.reason}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: '#eee', padding: 15, marginBottom: 15, borderRadius: 10 },
    event: { fontSize: 16, fontWeight: 'bold' },
    reason: { fontSize: 14, color: '#555' },
})

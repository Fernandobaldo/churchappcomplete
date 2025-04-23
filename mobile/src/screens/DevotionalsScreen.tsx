import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'

export default function DevotionalsScreen() {
    const [devotionals, setDevotionals] = useState<any[]>([])
    const navigation = useNavigation()

    useEffect(() => {
        api.get('/devotionals').then(res => setDevotionals(res.data))
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Devocionais</Text>
            <FlatList
                data={devotionals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('DevotionalDetail', { id: item.id })}
                    >
                        <Text style={styles.devTitle}>{item.title}</Text>
                        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('AddDevotional')}
            >
                <Text style={styles.buttonText}>+ Novo Devocional</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    card: { backgroundColor: '#eee', padding: 15, marginBottom: 15, borderRadius: 8 },
    devTitle: { fontSize: 16, fontWeight: 'bold' },
    date: { fontSize: 12, color: '#666' },
    button: {
        marginTop: 20,
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
})

import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'

export default function NoticesScreen() {
    const [notices, setNotices] = useState<any[]>([])
    const navigation = useNavigation()

    const fetchData = () => {
        api.get('/notices').then((res) => setNotices(res.data))
    }

    useEffect(() => {
        fetchData()
    }, [])

    const markAsRead = async (id: string) => {
        await api.post(`/notices/${id}/read`)
        fetchData()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Avisos e Comunicados</Text>

            <FlatList
                data={notices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => markAsRead(item.id)}>
                        <Text style={[styles.noticeTitle, !item.read && styles.unread]}>{item.title}</Text>
                        <Text>{item.message}</Text>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddNotice')}>
                <Text style={styles.buttonText}>+ Novo Aviso</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    card: { backgroundColor: '#eee', padding: 15, borderRadius: 8, marginBottom: 15 },
    noticeTitle: { fontSize: 16, marginBottom: 5 },
    unread: { fontWeight: 'bold' },
    date: { fontSize: 12, color: '#777', marginTop: 5 },
    button: {
        marginTop: 20,
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
})

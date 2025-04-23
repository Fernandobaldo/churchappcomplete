import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Button, Share } from 'react-native'
import api from '../api/api'

export default function DevotionalDetailScreen({ route }: any) {
    const { id } = route.params
    const [devotional, setDevotional] = useState<any>({})

    useEffect(() => {
        api.get(`/devotionals/${id}`).then(res => setDevotional(res.data))
    }, [])

    const handleShare = () => {
        Share.share({ message: devotional.content || '' })
    }

    const handleFavorite = () => {
        // Mock action
        alert('Adicionado aos favoritos!')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{devotional.title}</Text>
            <Text style={styles.date}>{new Date(devotional.date).toLocaleDateString()}</Text>
            <Text style={styles.content}>{devotional.content}</Text>

            <Button title="Compartilhar" onPress={handleShare} />
            <Button title="Favoritar" onPress={handleFavorite} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    date: { fontSize: 12, color: '#777', marginBottom: 20 },
    content: { fontSize: 16, marginBottom: 30 },
})

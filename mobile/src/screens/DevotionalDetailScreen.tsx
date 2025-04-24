import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'

export default function DevotionalDetailScreen() {
    const route = useRoute()
    const { devotional } = route.params as {
        devotional: {
            title: string
            passage: string
            content: string
            author: string
            date: string
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{devotional.title}</Text>
            <Text style={styles.passage}>{devotional.passage}</Text>
            <Text style={styles.date}>Data: {new Date(devotional.date).toLocaleDateString()}</Text>
            <Text style={styles.content}>{devotional.content}</Text>
            <Text style={styles.author}>Autor: {devotional.author}</Text>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    passage: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#3366FF',
        marginBottom: 6,
    },
    date: {
        fontSize: 14,
        color: '#888',
        marginBottom: 14,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    author: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginTop: 20,
    },
})

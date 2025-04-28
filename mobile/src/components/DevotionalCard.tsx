import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import api from '../api/api'
import { BibleText } from './BibleText';


export default function DevotionalCard({ devotional, refreshDevotionals }) {
    const navigation = useNavigation();
    const [likes, setLikes] = useState(devotional?.likesCount ?? 0);
    const [liked, setLiked] = useState(devotional?.liked ?? false);

    const handleLike = async () => {
        try {
        if (liked) {
            await api.delete(`/devotionals/${devotional.id}/unlike`)
            setLikes(likes - 1)

        } else {
            await api.post(`/devotionals/${devotional.id}/like`)
            setLikes(likes + 1)

        }
        setLiked(!liked)
        refreshDevotionals()
    } catch (error) {
        console.error('Erro ao curtir:', error.response?.data || error.message);
    }
}

    const handleShare = async () => {
        const text = `📖 ${devotional.passage}\n\n🇧🇷 ${devotional.textPt}\n\n🇫🇷 ${devotional.textFr}`
        await Share.share({ message: text })
    }

    return (
        <TouchableOpacity onPress={() => navigation.navigate('DevotionalDetails', { devotional })}>
         <View style={styles.card}>
            <Text style={styles.title}>{devotional.title}</Text>
            <Text style={styles.author}>por {devotional.author.name}</Text>
            <Text style={styles.passage}>{devotional.passage}</Text>
            <BibleText passage={devotional.passage} />
            <Text style={styles.content}>Reflexão: {devotional.content}</Text>

            <View style={styles.actions}>
                <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
                    <Text style={styles.likeText}>{liked ? '💖' : '🤍'} {likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Text style={styles.shareText}>📤 Compartilhar</Text>
                </TouchableOpacity>
            </View>
        </View>
        </TouchableOpacity>
    )
}


const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    author: { fontSize: 14, color: '#666', marginBottom: 8 },
    passage: { fontWeight: '600', marginBottom: 2 },
    content: { fontWeight: '300', marginBottom: 8, marginTop: 15 },
    text: { marginBottom: 8 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    likeButton: { padding: 8 },
    likeText: { fontSize: 16 },
    shareButton: { padding: 8 },
    shareText: { fontSize: 16, color: '#3366FF' },
})

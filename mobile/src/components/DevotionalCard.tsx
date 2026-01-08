import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons'

import api from '../api/api'
import { BibleText } from './BibleText';
import GlassCard from './GlassCard'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'


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
        <GlassCard
            onPress={() => navigation.navigate('DevotionalDetails', { devotional })}
            opacity={0.4}
            blurIntensity={20}
            borderRadius={20}
            style={styles.card}
        >
            <Text style={styles.title}>{devotional.title}</Text>
            <Text style={styles.author}>por {devotional.author.name}</Text>
            <Text style={styles.passage}>{devotional.passage}</Text>
            <BibleText passage={devotional.passage} />
            <Text style={styles.content}>Reflexão: {devotional.content}</Text>

            <View style={styles.actions}>
                <TouchableOpacity onPress={handleLike} style={styles.likeButton} activeOpacity={0.7}>
                    <Ionicons 
                        name={liked ? 'heart' : 'heart-outline'} 
                        size={20} 
                        color={liked ? colors.status.error : colors.text.tertiary} 
                    />
                    <Text style={styles.likeText}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton} activeOpacity={0.7}>
                    <Ionicons name="share-outline" size={20} color={colors.gradients.primary[1]} />
                    <Text style={styles.shareText}>Compartilhar</Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
    )
}


const styles = StyleSheet.create({
    card: { 
        padding: 20, 
        marginBottom: 16,
    },
    title: { 
        ...typography.styles.h4,
        color: colors.text.primary,
        marginBottom: 8,
    },
    author: { 
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginBottom: 12,
    },
    passage: { 
        ...typography.styles.subtitleSmall,
        color: colors.gradients.primary[1],
        marginBottom: 8,
    },
    content: { 
        ...typography.styles.body,
        color: colors.text.secondary,
        marginBottom: 8,
        marginTop: 16,
        lineHeight: 24,
    },
    text: { 
        marginBottom: 8,
    },
    actions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
    },
    likeButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 6,
    },
    likeText: { 
        ...typography.styles.bodySmall,
        color: colors.text.secondary,
    },
    shareButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 6,
    },
    shareText: { 
        ...typography.styles.bodySmall,
        color: colors.gradients.primary[1],
    },
})

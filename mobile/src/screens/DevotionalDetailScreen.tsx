import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Share} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { BibleText } from '../components/BibleText';
import DetailScreenLayout from '../components/layouts/DetailScreenLayout';
import GlassCard from '../components/GlassCard';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { colors } from '../theme/colors';
import { devotionalsService } from '../services/devotionals.service'


export default function DevotionalDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { devotional: initialDevotional } = (route.params as { devotional?: any }) || {};
    const [devotional, setDevotional] = useState(initialDevotional);
    const [loading, setLoading] = useState(!initialDevotional);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDevotional = useCallback(async () => {
        if (!initialDevotional?.id) {
            setError('Devocional não encontrado')
            setLoading(false)
            return
        }
        try {
            setError(null)
            const data = await devotionalsService.getById(initialDevotional.id)
            setDevotional(data)
        } catch (err: any) {
            console.error('Erro ao carregar detalhes do devocional:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar os detalhes do devocional.'
            setError(errorMessage)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [initialDevotional?.id])

    useEffect(() => {
        if (initialDevotional?.id) {
            fetchDevotional()
        } else {
            setLoading(false)
            setError('Devocional não encontrado')
        }
    }, [initialDevotional?.id, fetchDevotional])

    // Recarrega quando a tela recebe foco (após editar)
    useFocusEffect(
        useCallback(() => {
            if (initialDevotional?.id && !loading && !refreshing) {
                fetchDevotional()
            }
        }, [initialDevotional?.id, fetchDevotional, loading, refreshing])
    )

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchDevotional()
    }, [fetchDevotional])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchDevotional().finally(() => setLoading(false))
    }, [fetchDevotional])

    const isEmpty = !loading && !devotional && !error

    const handleShare = async () => {
        if (!devotional) return
        const text = `📖 ${devotional.passage}\n\n🇧🇷 ${devotional.textPt}\n\n🇫🇷 ${devotional.textFr}`
        await Share.share({ message: text })
    }

    const formattedDate = devotional ? new Date(devotional.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    }) : ''

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes do Devocional",
                Icon: FontAwesome5,
                iconName: "bible",
            }}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Devocional não encontrado"
            emptySubtitle="O devocional solicitado não existe ou foi removido"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onRetry={handleRetry}
        >
            {devotional && (
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                    {/* Título */}
                    <Text style={styles.title}>{devotional.title}</Text>

                {/* Data */}
                <Text style={styles.date}>{formattedDate}</Text>

                {/* Autor */}
                <Text style={styles.author}>por {devotional.author?.name ?? 'Autor desconhecido'}</Text>

                {/* Versículo */}
                <Text style={styles.passage}>
                    <BibleText passage={devotional.passage} />
                </Text>

                {/* Referência */}
                <Text style={styles.reference}>{devotional.passage}</Text>

                {/* Conteúdo/reflexão */}
                <Text style={styles.devotionalContent}>{devotional.content}</Text>

                {/* Botões Curtir / Compartilhar */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                        <EvilIcons name="share-apple" size={40} color="black" />
                    </TouchableOpacity>
                </View>
            </GlassCard>
            )}
        </DetailScreenLayout>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 24,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
        color: '#0F172A',
        textAlign: 'left',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        color: '#64748B',
        textAlign: 'left',
        marginBottom: 4,
    },
    author: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        color: '#64748B',
        textAlign: 'left',
        marginBottom: 16,
    },
    passage: {
        fontSize: 18,
        fontWeight: '400',
        fontStyle: 'italic',
        lineHeight: 28,
        color: '#0F172A',
        textAlign: 'left',
        marginBottom: 4,
    },
    reference: {
        fontSize: 12,
        fontWeight: '400',
        fontStyle: 'italic',
        lineHeight: 18,
        color: '#64748B',
        textAlign: 'left',
        marginBottom: 30,
    },
    devotionalContent: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#0F172A',
        textAlign: 'left',
        marginBottom: 30,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    actionButton: {
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
});

import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, ImageBackground, TouchableOpacity, Share} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { BibleText } from '../components/BibleText';
import DetailScreenLayout from '../components/layouts/DetailScreenLayout';
import GlassCard from '../components/GlassCard';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { colors } from '../theme/colors';
import api from "../api/api";


export default function DevotionalDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { devotional: initialDevotional } = route.params || {};
    const [devotional, setDevotional] = useState(initialDevotional);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDevotional = useCallback(async () => {
        if (!initialDevotional?.id) return
        try {
            setRefreshing(true)
            const response = await api.get(`/devotionals/${initialDevotional.id}`)
            setDevotional(response.data)
        } catch (error) {
            console.error('Erro ao carregar devocional:', error)
        } finally {
            setRefreshing(false)
        }
    }, [initialDevotional?.id])

    // Recarrega quando a tela recebe foco (após editar)
    useFocusEffect(
        useCallback(() => {
            if (initialDevotional?.id) {
                fetchDevotional()
            }
        }, [initialDevotional?.id, fetchDevotional])
    )

    const handleRefresh = useCallback(() => {
        fetchDevotional()
    }, [fetchDevotional])

    if (!devotional) {
        return (
            <DetailScreenLayout
                headerProps={{
                    title: "Detalhes do Devocional",
                    Icon: FontAwesome5,
                    iconName: "bible",
                }}
            >
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Devocional não encontrado.</Text>
                </View>
            </DetailScreenLayout>
        );
    }

    const handleShare = async () => {
        const text = `📖 ${devotional.passage}\n\n🇧🇷 ${devotional.textPt}\n\n🇫🇷 ${devotional.textFr}`
        await Share.share({ message: text })
    }

    const formattedDate = new Date(devotional.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes do Devocional",
                Icon: FontAwesome5,
                iconName: "bible",
            }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
        </DetailScreenLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 100,
    },
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 110,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '400',
        lineHeight: 28,
        color: colors.status.error,
    },
});

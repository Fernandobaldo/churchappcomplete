import React, { useEffect, useState, useCallback } from 'react'
import {View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, StyleSheet} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Toast from "react-native-toast-message";
import { colors } from '../theme/colors'
export default function EventDetailsScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params as { id: string }
    const { user } = useAuthStore()
    const [event, setEvent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchEvent = useCallback(async () => {
        try {
            const res = await api.get(`/events/${id}`)
            setEvent(res.data)
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do evento.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [id])

    useEffect(() => {
        fetchEvent()
    }, [fetchEvent])

    // Recarrega quando a tela recebe foco (após editar)
    useFocusEffect(
        useCallback(() => {
            fetchEvent()
        }, [fetchEvent])
    )

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchEvent()
    }, [fetchEvent])

    const hasPermissionToEdit =
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        user?.permissions?.some((p: any) => p.type === 'events_manage')

    const openDonationLink = () => {
        if (event?.donationLink) {
            Linking.openURL(event.donationLink).catch(() => {
                Toast.show({
                    type: 'error',
                    text1: 'Erro ao abrir link!',
                    text2: 'Houve um erro abrir link de pagamento'
                })
            })
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
            </View>
        )
    }

    if (!event) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Evento não encontrado.</Text>
            </View>
        )
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return 'Data inválida'
        return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    }

    const getTimeDisplay = () => {
        // Se há um campo time específico e não é 00:00
        if (event.time && event.time !== '00:00' && event.time.trim() !== '') {
            return event.time
        }
        
        // Se não há time específico, tenta extrair do startDate
        if (event.startDate) {
            const date = new Date(event.startDate)
            if (!isNaN(date.getTime())) {
                const hours = date.getHours()
                const minutes = date.getMinutes()
                // Só retorna se não for 00:00
                if (hours !== 0 || minutes !== 0) {
                    return format(date, 'HH:mm', { locale: ptBR })
                }
            }
        }
        
        // Retorna null se não houver horário válido
        return null
    }

    // Constrói URL completa da imagem do banner se necessário
    const bannerImageUrl = event?.imageUrl ? (() => {
        const imageUrl = event.imageUrl
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // URL absoluta, usar como está
            return imageUrl
        } else {
            // URL relativa, adicionar baseURL
            const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
            return `${api.defaults.baseURL}/${cleanUrl}`
        }
    })() : undefined

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes do Evento",
                Icon: FontAwesome5,
                iconName: "calendar",
                rightButtonIcon: hasPermissionToEdit ? (
                    <Ionicons name="create-outline" size={24} color="white" />
                ) : undefined,
                onRightButtonPress: hasPermissionToEdit
                    ? () => (navigation as any).navigate('EditEventScreen', { id: event.id })
                    : undefined,
            }}
            imageUrl={bannerImageUrl}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
            <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                <Text style={styles.eventName}>{event.title}</Text>
                
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Data e Hora</Text>
                        <Text style={styles.infoValue}>
                            {formatDate(event.startDate)}
                            {getTimeDisplay() && ` ${getTimeDisplay()}`}
                        </Text>
                    </View>
                </View>

                {event.location && (
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Local</Text>
                            <Text style={styles.infoValue}>{event.location}</Text>
                        </View>
                    </View>
                )}

                {event.description && (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionHeader}>Descrição</Text>
                        <Text style={styles.descriptionText}>{event.description}</Text>
                    </View>
                )}
            </GlassCard>

            {event.hasDonation && (
                <GlassCard opacity={0.45} blurIntensity={20} borderRadius={20} style={styles.donationCard}>
                    <View style={styles.donationHeader}>
                        <Ionicons name="heart" size={24} color={colors.status.error} />
                        <Text style={styles.donationTitle}>Contribuição</Text>
                    </View>
                    {event.donationReason && (
                        <View style={styles.donationInfo}>
                            <Text style={styles.donationLabel}>Motivo:</Text>
                            <Text style={styles.donationValue}>{event.donationReason}</Text>
                        </View>
                    )}
                    {event.donationLink && (
                        <TouchableOpacity onPress={openDonationLink} style={styles.donationLinkBtn} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[colors.status.error, '#DC2626'] as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.donationLinkBtnGradient}
                            >
                                <Ionicons name="link-outline" size={20} color="#fff" />
                                <Text style={styles.donationBtnText}>Abrir link de contribuição</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </GlassCard>
            )}
        </DetailScreenLayout>
    )
}



const styles = StyleSheet.create({
    card: {
        padding: 20,
        marginBottom: 16,
    },
    eventName: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        color: '#0F172A',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
    descriptionSection: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
    },
    descriptionHeader: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
    },
    donationCard: {
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.status.error,
    },
    donationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    donationTitle: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        color: '#0F172A',
        marginLeft: 8,
    },
    donationInfo: {
        marginBottom: 12,
    },
    donationLabel: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginBottom: 4,
    },
    donationValue: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
    donationLinkBtn: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    donationLinkBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    donationBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
})

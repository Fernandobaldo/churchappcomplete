import React, { useEffect, useState, useCallback } from 'react'
import {View, Text, TouchableOpacity, Linking, StyleSheet} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { eventsService } from '../services/events.service'
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
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchEvent = useCallback(async () => {
        try {
            setError(null)
            const data = await eventsService.getById(id)
            setEvent(data)
        } catch (err: any) {
            console.error('Erro ao carregar detalhes do evento:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar os detalhes do evento.'
            setError(errorMessage)
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
            if (!loading && !refreshing) {
                fetchEvent()
            }
        }, [fetchEvent, loading, refreshing])
    )

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchEvent()
    }, [fetchEvent])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchEvent().finally(() => setLoading(false))
    }, [fetchEvent])

    const isEmpty = !loading && !event && !error

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

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return 'Data inválida'
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return 'Data inválida'
        return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    }

    const getTimeDisplay = () => {
        if (!event) return null
        
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
            return `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/${cleanUrl}`
        }
    })() : undefined

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes do Evento",
                Icon: FontAwesome5,
                iconName: "calendar",
                rightButtonIcon: hasPermissionToEdit && event ? (
                    <Ionicons name="create-outline" size={24} color="white" />
                ) : undefined,
                onRightButtonPress: hasPermissionToEdit && event
                    ? () => (navigation as any).navigate('EditEventScreen', { id: event.id })
                    : undefined,
            }}
            imageUrl={bannerImageUrl}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Evento não encontrado"
            emptySubtitle="O evento solicitado não existe ou foi removido"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onRetry={handleRetry}
        >
            {event && (
                <>
                    <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                        <Text style={styles.eventName}>{event.title}</Text>
                        
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Data e Hora</Text>
                                <Text style={styles.infoValue}>
                                    {event.startDate ? formatDate(event.startDate) : 'Data não informada'}
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
                </>
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

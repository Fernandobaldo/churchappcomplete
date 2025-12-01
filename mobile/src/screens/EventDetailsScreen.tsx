import React, { useEffect, useState } from 'react'
import {View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator, StyleSheet} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Toast from "react-native-toast-message";
export default function EventDetailsScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params as { id: string }
    const { user } = useAuthStore()
    const [event, setEvent] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${id}`)
            setEvent(res.data)
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do evento.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvent()
    }, [id])

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
                <ActivityIndicator size="large" color="#3366FF" />
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
        return format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    }

    const formatTime = () => {
        if (event.time) {
            return event.time
        }
        if (event.startDate) {
            const date = new Date(event.startDate)
            if (!isNaN(date.getTime())) {
                return format(date, 'HH:mm')
            }
        }
        return 'Horário não informado'
    }

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
            imageUrl={event.imageUrl}
        >
            <View style={styles.card}>
                <Text style={styles.eventName}>{event.title}</Text>
                
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Data e Hora</Text>
                        <Text style={styles.infoValue}>
                            {formatDate(event.startDate)} {event.time && `(${event.time})`}
                        </Text>
                    </View>
                </View>

                {event.location && (
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#666" />
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
            </View>

            {event.hasDonation && (
                <View style={styles.donationCard}>
                    <View style={styles.donationHeader}>
                        <Ionicons name="heart" size={24} color="#EF4444" />
                        <Text style={styles.donationTitle}>Contribuição</Text>
                    </View>
                    {event.donationReason && (
                        <View style={styles.donationInfo}>
                            <Text style={styles.donationLabel}>Motivo:</Text>
                            <Text style={styles.donationValue}>{event.donationReason}</Text>
                        </View>
                    )}
                    {event.donationLink && (
                        <TouchableOpacity onPress={openDonationLink} style={styles.donationLinkBtn}>
                            <Ionicons name="link-outline" size={20} color="#fff" />
                            <Text style={styles.donationBtnText}>Abrir link de contribuição</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </DetailScreenLayout>
    )
}



const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    descriptionSection: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    descriptionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    donationCard: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    donationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    donationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    donationInfo: {
        marginBottom: 12,
    },
    donationLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    donationValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    donationLinkBtn: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    donationBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

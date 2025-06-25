import React, { useEffect, useState } from 'react'
import {View, Text, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator, StyleSheet} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import PageHeader from "../components/PageHeader";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Toast from "react-native-toast-message";
import { Image } from 'react-native'
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
        return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    }

    return (
        <View style={{  backgroundColor: 'white' }}>
            <PageHeader
                title={'Detalhes do Evento'}
                Icon={FontAwesome5}
                iconName="user"
            />
            {event.imageUrl && (
                <Image
                    source={{ uri: event.imageUrl }}
                    style={{ width: '100%', height: 200, marginBottom: 16 }}
                    resizeMode="cover"
                />
            )}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.eventName}>{event.title}</Text>
                <Text style={styles.bodyText}>{formatDate(event.startDate)} às {event.time || 'Horário não informado'}</Text>
                <Text style={styles.bodyText}>Local: {event.location || 'Não informado'}</Text>

                <Text style={styles.descriptionHeader}>Descrição:</Text>
                <Text style={styles.bodyText}>{event.description || 'Sem descrição'}</Text>

                {event.hasDonation && (
                    <View style={styles.hasDonationCard}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Contribuição</Text>
                        <Text style={{ marginBottom: 8 }}>Motivo: {event.donationReason || 'Não informado'}</Text>
                        <Text style={{ marginBottom: 8 }}>Link de pagamento: {event.donationLink || 'Não informado'}</Text>


                        {event.donationLink && (
                            <TouchableOpacity onPress={openDonationLink} style={styles.donationLinkBtn}>
                                <Text style={styles.donationBtnText}>
                                    Abrir link de contribuição
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {hasPermissionToEdit && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('EditEventScreen', { id: event.id })}
                        style={styles.editBtn}
                    >
                        <Text style={styles.buttonText}>Editar Evento</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',

    },
    subHeader:{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#eee' },
    subHeaderText:{ fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16 },
    eventName:{ fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderColor: '#eee'},
    bodyText:{
        color: '#555',
        marginBottom: 4 },

    descriptionHeader:{
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 10 },
    hasDonationCard:{
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 16 },
    editBtn:{
        backgroundColor: '#FFB200',
        padding: 14,
        borderRadius: 6,
        marginTop: 16 },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center' },
    donationLinkBtn:{ backgroundColor: '#3366FF', padding: 12, borderRadius: 6 },
    donationBtnText:{ color: 'white', textAlign: 'center', fontWeight: 'bold' },

})

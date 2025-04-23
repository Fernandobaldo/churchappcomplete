import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Header from '../components/Header'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import api from '../api/api'

export default function DashboardScreen() {
    const navigation = useNavigation()
    const [user, setUser] = useState<any>({})
    const [nextEvent, setNextEvent] = useState<any>(null)

    useEffect(() => {
        api.get('/auth/me').then((res) => setUser(res.data))
        api.get('/events/next').then((res) => setNextEvent(res.data))
    }, [])



    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Header />
            {/*<Text style={styles.header}>Bem-vindo, {user?.name}</Text>*/}
            <Text style={styles.subheader}>Página Inicial</Text>


            <View style={styles.cardContainer}>
                <DashboardTile title="Cultos" icon="church" onPress={() => navigation.navigate('Events')} />
                <DashboardTile title="Eventos" icon="calendar-alt" onPress={() => navigation.navigate('Events')} />
                <DashboardTile title="Devocionais" icon="bible" onPress={() => navigation.navigate('Contributions')} />
                <DashboardTile title="Contribuições" icon="hand-holding-heart" onPress={() => navigation.navigate('Contributions')} />


            </View>

            <View style={styles.bannerWrapper}>
            <Image
                source={require('../../assets/worshipImage.png')}
                style={styles.bannerImage}
                resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Culto de Domingo</Text>
            </View>
            </View>

            <Text style={styles.subheader}>Próximos eventos</Text>
            {nextEvent ? (
                <View>
                    <Text style={styles.eventTitle}>{nextEvent.title}</Text>
                    <Text>{new Date(nextEvent.date).toLocaleString()}</Text>
                </View>
            ) : (
                <Text>Nenhum evento agendado.</Text>
            )}


            <View style={styles.eventCard}>
                <View style={styles.dateBox}>
                    <Text style={styles.day}>27</Text>
                    <Text style={styles.month}>abril</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>Encontro de Jovens</Text>
                    <Text style={styles.eventInfo}>Sábado, 19:00</Text>
                </View>
            </View>
        </ScrollView>
    )
}

function DashboardTile({ title, onPress, icon }: { title: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.tileContent}>
            <FontAwesome5 name={icon} size={22} color="#333" style={styles.tileIcon} />
            <Text style={styles.tileText}>{title}</Text>
            </View>
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        flex: 1,
    },
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 30,
        marginLeft: 50,
    },
    cardContainer: {
        gap: 10,
        marginBottom: 20,
    },
    card: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 15,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: 160,
        resizeMode: 'cover',
        borderRadius: 12,

    },
    bannerTitle: {
        color: '#fff',
        fontSize: 35,
        fontWeight: 'bold',
    },

    subheader: {
        fontSize: 30,
        fontWeight: '600',
        marginBottom: 5,
        paddingTop: 5,
        marginLeft: 0.5,

    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
        borderRadius: 10,
    },
    dateBox: {
        width: 50,
        height: 50,
        backgroundColor: '#eee',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    day: {
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: '#eee',
    },
    month: {
        fontSize: 12,
        color: '#666',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventInfo: {
        fontSize: 14,
        color: '#666',
    },
    bannerWrapper: {
        position: 'relative',
        width: '100%',
        height: 160,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
        // backgroundColor: 'rgba(0,0,0,0.3)', // opcional
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tileContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tileIcon: {
        marginRight: 12,
    },
    tileText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
})
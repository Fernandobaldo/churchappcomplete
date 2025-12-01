import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import PageHeader from '../components/PageHeader'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface NextEvent {
    id: string
    title: string
    startDate: string
    location: string
    imageUrl?: string
}

interface ChurchInfo {
    id: string
    name: string
    logoUrl?: string | null
}

interface MemberProfile {
    avatarUrl?: string | null
    name: string
}

export default function DashboardScreen() {
    const navigation = useNavigation()
    const { user } = useAuthStore()
    const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
    const [loading, setLoading] = useState(true)
    const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const [upcomingEvents, setUpcomingEvents] = useState<NextEvent[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar próximo evento
                try {
                    const eventResponse = await api.get('/events/next')
                    setNextEvent(eventResponse.data || null)
                } catch (error) {
                    console.error('Erro ao buscar próximo evento:', error)
                    setNextEvent(null)
                }

                // Buscar perfil do membro para obter avatar
                if (user?.memberId) {
                    try {
                        const memberResponse = await api.get('/members/me')
                        if (memberResponse?.data) {
                            setUserAvatar(memberResponse.data.avatarUrl || null)
                        }
                    } catch (error) {
                        console.error('Erro ao buscar perfil do membro:', error)
                    }
                }

                // Buscar informações da igreja
                if (user?.churchId) {
                    try {
                        const churchResponse = await api.get(`/churches/${user.churchId}`)
                        if (churchResponse?.data) {
                            setChurchInfo({
                                id: churchResponse.data.id,
                                name: churchResponse.data.name,
                                logoUrl: churchResponse.data.logoUrl,
                            })
                        }
                    } catch (error) {
                        console.error('Erro ao buscar informações da igreja:', error)
                        // Fallback: usar nome do usuário ou padrão
                        setChurchInfo({
                            id: user.churchId || '',
                            name: 'Igreja',
                            logoUrl: null,
                        })
                    }
                } else {
                    // Se não tem churchId, ainda mostra algo
                    setChurchInfo({
                        id: '',
                        name: 'Igreja',
                        logoUrl: null,
                    })
                }

                // Buscar próximos 3 eventos
                try {
                    const eventsResponse = await api.get('/events')
                    if (eventsResponse?.data && Array.isArray(eventsResponse.data)) {
                        const now = new Date()
                        const upcoming = eventsResponse.data
                            .filter((e: NextEvent) => {
                                try {
                                    return new Date(e.startDate) >= now
                                } catch {
                                    return false
                                }
                            })
                            .sort((a: NextEvent, b: NextEvent) => {
                                try {
                                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                                } catch {
                                    return 0
                                }
                            })
                            .slice(0, 3)
                        setUpcomingEvents(upcoming)
                    } else {
                        setUpcomingEvents([])
                    }
                } catch (error) {
                    console.error('Erro ao buscar eventos:', error)
                    setUpcomingEvents([])
                }
            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) {
            fetchData()
        } else {
            setLoading(false)
        }
    }, [user])



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }


    return (
        <View style={styles.container}>
            <PageHeader
                churchLogo={churchInfo?.logoUrl || null}
                churchName={churchInfo?.name || undefined}
                userAvatar={userAvatar}
                userName={user?.name}
                onAvatarPress={() => navigation.navigate('ProfileScreen' as never)}
            />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Página inicial</Text>
                </View>

                {/* Links rápidos */}
                <View style={styles.quickLinks}>
                    <TouchableOpacity
                        style={styles.quickLinkItem}
                        onPress={() => navigation.navigate('Events' as never)}
                    >
                        <Ionicons name="calendar-outline" size={24} color="#3366FF" />
                        <Text style={styles.quickLinkText}>Eventos</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickLinkItem}
                        onPress={() => navigation.navigate('Devotionals' as never)}
                    >
                        <Ionicons name="book-outline" size={24} color="#3366FF" />
                        <Text style={styles.quickLinkText}>Devocionais</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickLinkItem}
                        onPress={() => navigation.navigate('Contributions' as never)}
                    >
                        <Ionicons name="heart-outline" size={24} color="#3366FF" />
                        <Text style={styles.quickLinkText}>Contribuições</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Banner do próximo evento */}
                <TouchableOpacity
                    style={styles.eventBanner}
                    onPress={() => {
                        if (nextEvent) {
                            (navigation as any).navigate('EventDetails', { id: nextEvent.id })
                        } else {
                            (navigation as any).navigate('Events')
                        }
                    }}
                    activeOpacity={0.9}
                >
                    {nextEvent?.imageUrl ? (
                        <Image 
                            source={{ uri: nextEvent.imageUrl }} 
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Image 
                            source={require('../../assets/worshipImage.png')} 
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                    )}
                    <View style={styles.bannerOverlay}>
                        <Text style={styles.bannerTitle}>
                            {nextEvent?.title || 'Próximo Evento'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Próximos eventos - Carrossel */}
                <View style={styles.upcomingEventsSection}>
                    <Text style={styles.sectionTitle}>Próximos eventos</Text>
                    {upcomingEvents.length > 0 ? (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.eventsCarousel}
                        >
                            {upcomingEvents.map((event) => (
                                <TouchableOpacity
                                    key={event.id}
                                    style={styles.eventCard}
                                    onPress={() => (navigation as any).navigate('EventDetails', { id: event.id })}
                                >
                                    <View style={styles.eventDateBox}>
                                        <Text style={styles.eventDay}>
                                            {format(new Date(event.startDate), 'dd', { locale: ptBR })}
                                        </Text>
                                        <Text style={styles.eventMonth}>
                                            {format(new Date(event.startDate), 'MMM', { locale: ptBR })}
                                        </Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventCardTitle} numberOfLines={2}>
                                            {event.title}
                                        </Text>
                                        <Text style={styles.eventCardDateTime}>
                                            {format(new Date(event.startDate), "EEEE, HH:mm", { locale: ptBR })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.noEventsContainer}>
                            <Text style={styles.noEventsText}>Nenhum evento próximo</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        marginTop: 110, // Altura do header fixo
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    welcomeSection: {
        marginTop: 24,
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    quickLinks: {
        marginBottom: 20,
    },
    quickLinkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickLinkText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
    },
    eventBanner: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    upcomingEventsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    eventsCarousel: {
        paddingRight: 16,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: width - 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventDateBox: {
        width: 60,
        height: 60,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventDay: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    eventMonth: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    eventInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    eventCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    eventCardDateTime: {
        fontSize: 14,
        color: '#666',
        textTransform: 'capitalize',
    },
    noEventsContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    noEventsText: {
        fontSize: 16,
        color: '#666',
    },
})
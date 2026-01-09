import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Dimensions, FlatList, ImageBackground } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import EventCard from '../components/EventCard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { NextEvent, ChurchInfo, Profile } from '../types'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

export default function DashboardScreen() {
    const navigation = useNavigation()
    const { user } = useAuthStore()
    const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const [upcomingEvents, setUpcomingEvents] = useState<NextEvent[]>([])
    const [currentEventIndex, setCurrentEventIndex] = useState(0)
    const carouselRef = useRef<FlatList>(null)

    // Função para obter data/hora completa do evento considerando time
    const getEventDateTime = (event: { startDate: string; time?: string }): Date => {
        const startDate = new Date(event.startDate)
        
        // Se houver campo time, usa ele
        if (event.time && event.time.trim() !== '' && event.time !== '00:00') {
            const [hours, minutes] = event.time.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
                startDate.setHours(hours, minutes, 0, 0)
            }
        } else {
            // Se não houver time ou for 00:00, mantém o horário do startDate
            // (já vem do backend com horário se foi definido)
        }
        
        return startDate
    }

    const fetchData = useCallback(async () => {
        try {
            // Buscar todos os eventos e aplicar o mesmo sort da página de eventos
            try {
                const eventsResponse = await api.get<NextEvent[]>('/events')
                if (eventsResponse?.data && Array.isArray(eventsResponse.data)) {
                    const now = new Date()
                    
                    // Filtra eventos futuros
                    const upcoming = eventsResponse.data
                        .filter((e: NextEvent) => {
                            try {
                                return getEventDateTime(e) >= now
                            } catch {
                                return false
                            }
                        })
                        // Ordena considerando data e horário (do mais próximo para o mais distante)
                        .sort((a: NextEvent, b: NextEvent) => {
                            try {
                                const dateA = getEventDateTime(a)
                                const dateB = getEventDateTime(b)
                                return dateA.getTime() - dateB.getTime()
                            } catch {
                                return 0
                            }
                        })
                    
                    // Pega o primeiro (mais próximo)
                    const next = upcoming.length > 0 ? upcoming[0] : null
                    
                    if (next && next.imageUrl) {
                        // Constrói URL completa se necessário
                        let imageUrl = next.imageUrl
                        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                            // URL absoluta, usar como está
                        } else {
                            // URL relativa, adicionar baseURL
                            const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
                            imageUrl = `${api.defaults.baseURL}/${cleanUrl}`
                        }
                        setNextEvent({ ...next, imageUrl })
                    } else {
                        setNextEvent(next)
                    }
                } else {
                    setNextEvent(null)
                }
            } catch (error) {
                console.error('Erro ao buscar próximo evento:', error)
                setNextEvent(null)
            }

            // Buscar perfil do membro para obter avatar
            // Só tenta buscar se o usuário tem memberId (já tem Member associado)
            if (user?.memberId) {
                try {
                    const memberResponse = await api.get<Profile>('/members/me')
                    if (memberResponse?.data) {
                        const avatarUrl = memberResponse.data.avatarUrl
                        if (avatarUrl) {
                            // Se o avatar não começa com http, adiciona a baseURL
                            if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
                                setUserAvatar(avatarUrl)
                            } else {
                                // Remove barra inicial se houver
                                const cleanUrl = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl
                                setUserAvatar(`${api.defaults.baseURL}/${cleanUrl}`)
                            }
                        } else {
                            setUserAvatar(null)
                        }
                    } else {
                        setUserAvatar(null)
                    }
                } catch (error: any) {
                    // 404 significa que o membro ainda não foi criado (normal durante onboarding)
                    // Não é um erro crítico, apenas não tem avatar ainda
                    if (error.response?.status !== 404) {
                        console.error('Erro ao buscar perfil do membro:', error)
                    }
                    // Mesmo com erro, define como null para mostrar placeholder
                    setUserAvatar(null)
                }
            } else {
                // Usuário ainda não tem Member associado (durante onboarding)
                setUserAvatar(null)
            }

            // Buscar informações da igreja
            if (user?.churchId) {
                try {
                    const churchResponse = await api.get<ChurchInfo>(`/churches/${user.churchId}`)
                    if (churchResponse?.data) {
                        let logoUrl = churchResponse.data.logoUrl
                        // Construir URL completa do logo se necessário
                        if (logoUrl) {
                            if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                                // URL absoluta, usar como está
                            } else {
                                // URL relativa, adicionar baseURL
                                const cleanUrl = logoUrl.startsWith('/') ? logoUrl.substring(1) : logoUrl
                                logoUrl = `${api.defaults.baseURL}/${cleanUrl}`
                            }
                        }
                        setChurchInfo({
                            id: churchResponse.data.id,
                            name: churchResponse.data.name,
                            logoUrl: logoUrl || null,
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

            // Buscar próximos 3 eventos (usa a mesma lógica de ordenação)
            try {
                const eventsResponse = await api.get<NextEvent[]>('/events')
                if (eventsResponse?.data && Array.isArray(eventsResponse.data)) {
                    const now = new Date()
                    const upcoming = eventsResponse.data
                        .filter((e: NextEvent) => {
                            try {
                                return getEventDateTime(e) >= now
                            } catch {
                                return false
                            }
                        })
                        // Ordena considerando data e horário (do mais próximo para o mais distante)
                        .sort((a: NextEvent, b: NextEvent) => {
                            try {
                                const dateA = getEventDateTime(a)
                                const dateB = getEventDateTime(b)
                                return dateA.getTime() - dateB.getTime()
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
            setRefreshing(false)
        }
    }, [user])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (user) {
            fetchData()
        } else {
            setLoading(false)
        }
    }, [user, fetchData])

    // Atualiza os dados quando a tela recebe foco (ex: ao voltar das configurações)
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchData()
            }
        }, [user, fetchData])
    )

    // Auto-play do carousel a cada 5 segundos
    useEffect(() => {
        if (upcomingEvents.length <= 1) return

        const interval = setInterval(() => {
            setCurrentEventIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % upcomingEvents.length
                carouselRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                })
                return nextIndex
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [upcomingEvents.length])

    // Handler para quando o usuário scrolla manualmente
    const handleScroll = useCallback((event: any) => {
        const slideSize = width - 48 // Largura do card + margens
        const offsetX = event.nativeEvent.contentOffset.x
        const index = Math.round(offsetX / slideSize)
        const clampedIndex = Math.max(0, Math.min(index, upcomingEvents.length - 1))
        if (clampedIndex !== currentEventIndex) {
            setCurrentEventIndex(clampedIndex)
        }
    }, [upcomingEvents.length, currentEventIndex])

    // Constrói URL completa da imagem do banner do evento se necessário
    const bannerImageUri = useMemo(() => {
        if (!nextEvent?.imageUrl) return undefined
        
        const imageUrl = nextEvent.imageUrl
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // URL absoluta, usar como está
            return imageUrl
        } else {
            // URL relativa, adicionar baseURL
            const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
            return `${api.defaults.baseURL}/${cleanUrl}`
        }
    }, [nextEvent?.imageUrl])

    // Renderiza um evento no carousel
    const renderEventCard = useCallback(({ item }: { item: NextEvent }) => (
        <EventCard
            event={item}
            onPress={() => {
                // Navega para Main (TabNavigator) primeiro para garantir que o navbar apareça
                navigation.navigate('Main' as never)
                // Depois navega para os detalhes do evento
                setTimeout(() => {
                    (navigation as any).navigate('EventDetails', { id: item.id })
                }, 100)
            }}
            style={styles.eventCard}
        />
    ), [navigation])

    if (loading) {
        return (
            <ViewScreenLayout
                headerProps={{
                    userAvatar: userAvatar,
                    userName: user?.name || 'Usuário',
                    onAvatarPress: () => navigation.navigate('ProfileScreen' as never),
                    transparent: true,
                }}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3366FF" />
                </View>
            </ViewScreenLayout>
        )
    }

    return (
        <ViewScreenLayout
            headerProps={{
                userAvatar: userAvatar,
                userName: user?.name || 'Usuário',
                onAvatarPress: () => navigation.navigate('ProfileScreen' as never),
                transparent: true,
            }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>
                        {churchInfo?.name || 'Igreja'}
                    </Text>
                </View>

                {/* Links rápidos */}
                <View style={styles.quickLinks}>
                    <GlassCard
                        onPress={() => {
                            // Navega para Main (TabNavigator) e depois para a tab Agenda
                            navigation.navigate('Main' as never)
                            setTimeout(() => {
                                (navigation as any).navigate('Agenda')
                            }, 100)
                        }}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.quickLinkItem}
                    >
                        <View style={styles.quickLinkContent}>
                            <Ionicons name="calendar-outline" size={28} color={colors.gradients.primary[1]} />
                            <Text style={styles.quickLinkText}>Eventos</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                        </View>
                    </GlassCard>
                    <GlassCard
                        onPress={() => {
                            // Navega para Main (TabNavigator) e depois para a tab Devocionais
                            navigation.navigate('Main' as never)
                            setTimeout(() => {
                                (navigation as any).navigate('Devocionais')
                            }, 100)
                        }}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.quickLinkItem}
                    >
                        <View style={styles.quickLinkContent}>
                            <Ionicons name="book-outline" size={28} color={colors.gradients.secondary[1]} />
                            <Text style={styles.quickLinkText}>Devocionais</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                        </View>
                    </GlassCard>
                    <GlassCard
                        onPress={() => {
                            // Navega para Main (TabNavigator) e depois para a tab Contribuições
                            navigation.navigate('Main' as never)
                            setTimeout(() => {
                                (navigation as any).navigate('Contribuições')
                            }, 100)
                        }}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.quickLinkItem}
                    >
                        <View style={styles.quickLinkContent}>
                            <Ionicons name="heart-outline" size={28} color={colors.status.error} />
                            <Text style={styles.quickLinkText}>Contribuições</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                        </View>
                    </GlassCard>
                </View>

                {/* Banner do próximo evento */}
                <TouchableOpacity
                    style={styles.eventBanner}
                    onPress={() => {
                        if (nextEvent) {
                            // Navega para Main (TabNavigator) primeiro para garantir que o navbar apareça
                            navigation.navigate('Main' as never)
                            // Depois navega para os detalhes do evento
                            setTimeout(() => {
                                (navigation as any).navigate('EventDetails', { id: nextEvent.id })
                            }, 100)
                        } else {
                            // Navega para Main (TabNavigator) e depois para a tab Agenda
                            navigation.navigate('Main' as never)
                            setTimeout(() => {
                                (navigation as any).navigate('Agenda')
                            }, 100)
                        }
                    }}
                    activeOpacity={0.9}
                >
                    <ImageBackground
                        source={bannerImageUri 
                            ? { uri: bannerImageUri } 
                            : require('../../assets/worshipImage.png')
                        }
                        style={styles.bannerImage}
                        resizeMode="cover"
                        defaultSource={require('../../assets/worshipImage.png')}
                    >
                        <View style={styles.bannerOverlay}>
                            <Text style={styles.bannerTitle}>
                                {nextEvent?.title || 'Próximo Evento'}
                            </Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Próximos eventos - Carrossel */}
                <View style={styles.upcomingEventsSection}>
                    <Text style={styles.sectionTitle}>Próximos eventos</Text>
                    {upcomingEvents.length > 0 ? (
                        <>
                            <FlatList
                                ref={carouselRef}
                                data={upcomingEvents}
                                renderItem={renderEventCard}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={width - 48}
                                decelerationRate="fast"
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                contentContainerStyle={styles.eventsCarousel}
                                getItemLayout={(data, index) => ({
                                    length: width - 48,
                                    offset: (width - 48) * index,
                                    index,
                                })}
                            />
                            {/* Indicadores de posição */}
                            <View style={styles.carouselIndicators}>
                                {upcomingEvents.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            index === currentEventIndex && styles.indicatorActive,
                                        ]}
                                    />
                                ))}
                            </View>
                        </>
                    ) : (
                        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.noEventsContainer}>
                            <Text style={styles.noEventsText}>Nenhum evento próximo</Text>
                        </GlassCard>
                    )}
                </View>
        </ViewScreenLayout>
    )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '600',
        lineHeight: 38,
        color: '#0F172A',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
        marginTop: 4,
    },
    quickLinks: {
        marginBottom: 24,
    },
    quickLinkItem: {
        marginBottom: 16,
        padding: 0,
    },
    quickLinkContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    quickLinkText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginLeft: 16,
    },
    eventBanner: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        marginBottom: 28,
        overflow: 'hidden',
        ...colors.shadow.glass,
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
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        padding: 20,
    },
    bannerTitle: {
        fontSize: 28,
        fontWeight: '600',
        lineHeight: 36,
        color: '#FFFFFF',
    },
    upcomingEventsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        color: '#0F172A',
        marginBottom: 20,
    },
    eventsCarousel: {
        paddingRight: 16,
    },
    eventCard: {
        marginRight: 16,
        width: width - 48,
    },
    noEventsContainer: {
        padding: 32,
        alignItems: 'center',
    },
    noEventsText: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
    },
    carouselIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(148, 163, 184, 0.3)',
    },
    indicatorActive: {
        width: 24,
        backgroundColor: colors.gradients.primary[1],
    },
})
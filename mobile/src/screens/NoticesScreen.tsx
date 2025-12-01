import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import Tabs from '../components/Tabs'

export default function NoticesScreen() {
    const [notices, setNotices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
    const navigation = useNavigation()
    const { user } = useAuthStore()

    const fetchData = async () => {
        try {
            const res = await api.get('/notices')
            setNotices(res.data || [])
        } catch (error) {
            console.error('Erro ao carregar avisos:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const onRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notices/${id}/read`)
            fetchData()
        } catch (error) {
            console.error('Erro ao marcar aviso como lido:', error)
        }
    }

    const canManageNotices = hasAccess(user, 'notice_manage')

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
                title="Avisos e Comunicados"
                Icon={FontAwesome5}
                iconName="bell"
                rightButtonIcon={
                    canManageNotices ? (
                        <Ionicons name="add" size={24} color="white" />
                    ) : undefined
                }
                onRightButtonPress={
                    canManageNotices
                        ? () => navigation.navigate('AddNotice' as never)
                        : undefined
                }
            />

            {/* Tabs */}
            <Tabs
                tabs={[
                    {
                        key: 'unread',
                        label: 'Não Lidos',
                        badge: notices.filter(n => !n.read).length > 0 
                            ? notices.filter(n => !n.read).length 
                            : undefined,
                    },
                    {
                        key: 'read',
                        label: 'Lidos',
                    },
                ]}
                activeTab={activeTab}
                onTabChange={(key) => setActiveTab(key as 'unread' | 'read')}
                style={styles.tabsContainerWithHeader}
            />

            <FlatList
                data={notices.filter(item => 
                    activeTab === 'unread' ? !item.read : item.read
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, !item.read && styles.unreadCard]}
                        onPress={() => {
                            if (!item.read) {
                                markAsRead(item.id)
                            }
                        }}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderLeft}>
                                {!item.read && <View style={styles.unreadIndicator} />}
                                <Text style={[styles.noticeTitle, !item.read && styles.unreadTitle]}>
                                    {item.title}
                                </Text>
                            </View>
                            {!item.read && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadBadgeText}>Novo</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.noticeMessage}>{item.message}</Text>
                        <Text style={styles.date}>
                            {format(new Date(item.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            {activeTab === 'unread' 
                                ? 'Nenhum aviso não lido' 
                                : 'Nenhum aviso lido'}
                        </Text>
                    </View>
                }
            />

            {canManageNotices && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddNotice' as never)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        marginTop: 0, // Removido porque tabsContainer já tem o espaçamento
    },
    tabsContainerWithHeader: {
        marginTop: 110, // Altura do header fixo
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#3366FF',
        backgroundColor: '#F0F4FF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3366FF',
        marginRight: 8,
    },
    noticeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    unreadTitle: {
        fontWeight: 'bold',
    },
    unreadBadge: {
        backgroundColor: '#3366FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    noticeMessage: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 12,
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3366FF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
})

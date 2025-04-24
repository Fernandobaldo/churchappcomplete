import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'

export default function EventsScreen() {
    const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
    const [events, setEvents] = useState([])

    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions || []

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/events')
            const now = new Date()

            const data = res.data || []
console.log((data))
            const filtered = tab === 'proximos'
                ? data.filter((e) => new Date(e.date) >= now)
                : data.filter((e) => new Date(e.date) < now)

            // Só atualiza se os dados realmente mudarem
            setEvents((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
                    return filtered
                }
                return prev
            })
        } catch (error) {
            console.error('Erro ao carregar eventos:', error)
        }
    }, [tab])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <FontAwesome5 name="church" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.headerTitle}>Eventos e Cultos</Text>
                {permissions.includes('event_manage') && (
                    <TouchableOpacity style={styles.plusCircle} onPress={() => navigation.navigate('AddEvent')}>
                        <FontAwesome5 name="plus" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setTab('proximos')} style={[styles.tab, tab === 'proximos' && styles.activeTab]}>
                    <Text style={[styles.tabText, tab === 'proximos' && styles.activeTabText]}>Próximos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTab('passados')} style={[styles.tab, tab === 'passados' && styles.activeTab]}>
                    <Text style={[styles.tabText, tab === 'passados' && styles.activeTabText]}>Passados</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.dateLabel}>{new Date(item.date).toLocaleDateString()}</Text>
                        <View style={styles.eventBox}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.subtitle}>
                                    {new Date(item.date).toLocaleDateString()} • {item.time}
                                </Text>
                                <Text style={styles.subtitle}>{item.location}</Text>
                            </View>
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {permissions.includes('event_manage') && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent')}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.fabText}>Adicionar</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        backgroundColor: '#3366FF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'relative'
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    plusCircle: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 6,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f7f7f7',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderColor: '#3366FF',
    },
    tabText: {
        color: '#888',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#3366FF',
        fontWeight: 'bold',
    },
    card: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    dateLabel: {
        color: '#666',
        marginBottom: 6,
        fontSize: 14,
    },
    eventBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#666',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3366FF',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
})

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'

export default function ContributionsScreen() {
    const [contributions, setContributions] = useState([])
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions || []

    const fetchContributions = useCallback(async () => {
        try {
            const res = await api.get('/contributions')
            setContributions(res.data || [])
        } catch (error) {
            console.error('Erro ao carregar contribuições:', error)
        }
    }, [])

    useEffect(() => {
        fetchContributions()
    }, [fetchContributions])

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <FontAwesome5 name="hand-holding-heart" size={22} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.headerTitle}>Contribuir</Text>
            </View>

            <Text style={styles.subtitle}>Escolha abaixo as oportunidades para contribuir:</Text>

            <FlatList
                data={contributions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                        <TouchableOpacity style={styles.contributeButton} onPress={() => navigation.navigate('ContributionDetail', { contribution: item })}>
                            <Text style={styles.buttonText}>Contribuir</Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {permissions.includes('contribution_manage') && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddContribution')}>
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
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        padding: 20,
        color: '#444',
        fontSize: 15,
    },
    card: {
        backgroundColor: '#f9f9f9',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        color: '#666',
        marginTop: 4,
    },
    contributeButton: {
        backgroundColor: '#D6E4FF',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        marginLeft: 12,
    },
    buttonText: {
        color: '#3366FF',
        fontWeight: '600',
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

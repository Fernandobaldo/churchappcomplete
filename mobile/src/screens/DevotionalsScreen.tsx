import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import DevotionalCard from '../components/DevotionalCard'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {useAuthStore} from "../stores/authStore";

export default function FeedDevotionalsScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []



    const [devotionals, setDevotionals] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchDevotionals = async () => {
        try {
            const res = await api.get('/devotionals')
            setDevotionals(res.data)
        } catch (error) {
            console.error('Erro ao carregar devocionais:', error)
        }
    }

    useEffect(() => {
        const loadDevotionals = async () => {
            setLoading(true)
            await fetchDevotionals()
            setLoading(false)
        }
        loadDevotionals()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchDevotionals()
        setRefreshing(false)
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    const canManageDevotionals =
        user.role === 'ADMINGERAL' ||
        user.role === 'ADMINFILIAL' ||
        user.permissions?.some((p: any) => p.type === 'devotional_manage')


    return (
        <View style={styles.container}>
            {/* Cabeçalho igual a Eventos */}
            <View style={styles.headertop}>
                <FontAwesome5 name="bible" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.headerTitletop}>Devocionais e Estudos</Text>
            </View>

            <FlatList
                contentContainerStyle={styles.list}
                data={devotionals}
                renderItem={({ item }) => (
                    <DevotionalCard devotional={item} refreshDevotionals={fetchDevotionals} />
                )}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>Nenhum devocional encontrado 🙏</Text>
                    </View>
                }
            />

            {/* Botão Flutuante de Adicionar */}
            {canManageDevotionals && (
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddDevotional')}
            >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.fabText}>Adicionar</Text>
            </TouchableOpacity>
                )}
        </View>
    )
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#666', marginBottom: 20 },
    header: {
        backgroundColor: '#3366FF',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    list: { padding: 16, paddingBottom: 100 }, // espaço extra para botão flutuante
    fab: {
        position: 'absolute',
        right: 20,
        marginBottom: 50,
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
    container: { flex: 1},
    headertop: {
        backgroundColor: '#3366FF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'relative'
    },
    headerTitletop: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    })

import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import DevotionalCard from '../components/DevotionalCard'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function FeedDevotionalsScreen() {
    const navigation = useNavigation()

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

    if (devotionals.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Nenhum devocional encontrado 🙏</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddDevotional')}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        )
    }

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
            />

            {/* Botão Flutuante de Adicionar */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddDevotional')}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
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
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#3366FF',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
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
    }
    })

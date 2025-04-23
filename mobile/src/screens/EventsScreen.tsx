import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'

export default function EventsScreen() {
    const [events, setEvents] = useState<any[]>([])
    const navigation = useNavigation()

    useEffect(() => {
        api.get('/events').then(res => setEvents(res.data))
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Próximos Eventos</Text>
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetail', { id: item.id })}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text>{new Date(item.date).toLocaleString()}</Text>
                        <Text>{item.location}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEvent')}>
                <Text style={styles.addText}>+ Adicionar Evento</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 15, backgroundColor: '#eee', marginBottom: 10, borderRadius: 8 },
    eventTitle: { fontSize: 16, fontWeight: '600' },
    addButton: {
        marginTop: 10,
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    addText: { color: '#fff', fontWeight: 'bold' },
})

// xxxxxxx
//
// import React, { useState } from 'react'
// import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
// import { Ionicons } from '@expo/vector-icons'
//
// const EVENTS = [
//     {
//         id: '1',
//         title: 'Encontro de Homens',
//         date: '27/04/2024',
//         time: '09:00',
//         location: 'Salão de Eventos',
//     },
//     {
//         id: '2',
//         title: 'Culto de Celebração',
//         date: '28/04/2024',
//         time: '18:00',
//         location: 'Auditório Principal',
//     },
//     {
//         id: '3',
//         title: 'Encontro de Casais',
//         date: '28/04/2024',
//         time: '19:30',
//         location: 'Salão de Eventos',
//     },
//     {
//         id: '4',
//         title: 'Culto da Família',
//         date: '01/05/2024',
//         time: '19:00',
//         location: 'Auditório Principal',
//     },
// ]
//
// export default function EventsScreen() {
//     const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
//
//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <Ionicons name="ios-home" size={24} color="white" style={{ marginRight: 8 }} />
//                 <Text style={styles.headerTitle}>Eventos e Cultos</Text>
//                 <TouchableOpacity style={styles.plusCircle}>
//                     <Ionicons name="add" size={26} color="white" />
//                 </TouchableOpacity>
//             </View>
//
//             <View style={styles.tabs}>
//                 <TouchableOpacity onPress={() => setTab('proximos')} style={[styles.tab, tab === 'proximos' && styles.activeTab]}>
//                     <Text style={[styles.tabText, tab === 'proximos' && styles.activeTabText]}>Próximos</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => setTab('passados')} style={[styles.tab, tab === 'passados' && styles.activeTab]}>
//                     <Text style={[styles.tabText, tab === 'passados' && styles.activeTabText]}>Passados</Text>
//                 </TouchableOpacity>
//             </View>
//
//             <FlatList
//                 data={EVENTS}
//                 keyExtractor={(item) => item.id}
//                 renderItem={({ item }) => (
//                     <View style={styles.card}>
//                         <Text style={styles.dateLabel}>{item.date}</Text>
//                         <View style={styles.eventBox}>
//                             <View style={{ flex: 1 }}>
//                                 <Text style={styles.title}>{item.title}</Text>
//                                 <Text style={styles.subtitle}>{item.date} • {item.time}</Text>
//                                 <Text style={styles.subtitle}>{item.location}</Text>
//                             </View>
//                         </View>
//                     </View>
//                 )}
//                 contentContainerStyle={{ paddingBottom: 80 }}
//             />
//
//             <TouchableOpacity style={styles.fab}>
//                 <Ionicons name="add" size={24} color="white" />
//                 <Text style={styles.fabText}>Adicionar</Text>
//             </TouchableOpacity>
//         </View>
//     )
// }
//
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#fff' },
//     header: {
//         backgroundColor: '#3366FF',
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingTop: 50,
//         paddingHorizontal: 20,
//         paddingBottom: 20,
//         position: 'relative'
//     },
//     headerTitle: {
//         color: 'white',
//         fontSize: 18,
//         fontWeight: 'bold',
//         flex: 1,
//     },
//     plusCircle: {
//         backgroundColor: 'rgba(255,255,255,0.2)',
//         borderRadius: 20,
//         padding: 4,
//     },
//     tabs: {
//         flexDirection: 'row',
//         borderBottomWidth: 1,
//         borderColor: '#eee',
//         backgroundColor: '#f7f7f7',
//     },
//     tab: {
//         flex: 1,
//         alignItems: 'center',
//         paddingVertical: 10,
//     },
//     activeTab: {
//         borderBottomWidth: 3,
//         borderColor: '#3366FF',
//     },
//     tabText: {
//         color: '#888',
//         fontWeight: '500',
//     },
//     activeTabText: {
//         color: '#3366FF',
//         fontWeight: 'bold',
//     },
//     card: {
//         paddingHorizontal: 20,
//         paddingTop: 20,
//     },
//     dateLabel: {
//         color: '#666',
//         marginBottom: 6,
//         fontSize: 14,
//     },
//     eventBox: {
//         backgroundColor: '#fff',
//         padding: 15,
//         borderRadius: 12,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 6,
//         elevation: 3,
//     },
//     title: {
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     subtitle: {
//         color: '#666',
//         marginTop: 4,
//     },
//     fab: {
//         position: 'absolute',
//         right: 20,
//         bottom: 20,
//         backgroundColor: '#3366FF',
//         paddingVertical: 12,
//         paddingHorizontal: 18,
//         borderRadius: 30,
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         shadowColor: '#000',
//         shadowOpacity: 0.2,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 4,
//         elevation: 6,
//     },
//     fabText: {
//         color: '#fff',
//         fontWeight: 'bold',
//     },
// })

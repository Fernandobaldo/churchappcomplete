// screens/MembersListScreen.tsx

import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'
import { Ionicons } from '@expo/vector-icons'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";


interface Member {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
    branchId: string

}

export default function MembersListScreen() {
    const navigation = useNavigation()
    const [members, setMembers] = useState<Member[]>([])
    const [search, setSearch] = useState('')
    const [refreshing, setRefreshing] = useState(false)


    useEffect(() => {
        async function fetchMembers() {
            try {
                const res = await api.get('/members')
                setMembers(res.data)
            } catch (err) {
                console.error('Erro ao buscar membros:', err)
            }
        }
        fetchMembers()
    }, [])

    const filteredMembers = members.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleRefresh = async () => {
        setRefreshing(true)
        await filteredMembers
        setRefreshing(false)
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title="Membros"
                Icon={FontAwesome5}
                iconName="user"
                rightButtonIcon={<Ionicons name="add" size={24} color="white" />}
                keyExtractor={(item) => item.branchId}

                onRightButtonPress={() => {
                    navigation.navigate('MemberRegistrationScreen')

                }}
            />
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar membros"
                value={search}
                onChangeText={setSearch}
            />

            <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.memberRow}
                        onPress={() => navigation.navigate('ProfileScreen'as never, { memberId: item.id } as never)}

                    >
                        <Image
                            source={{ uri: item.avatarUrl || 'https://via.placeholder.com/50' }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={styles.memberName}>{item.name}</Text>
                            <Text style={styles.memberRole}>{item.role}</Text>
                        </View>
                        <View style={styles.icon}>{item.icon}</View>
                        <Ionicons name="chevron-forward" size={18} color="#ccc"/>
                    </TouchableOpacity>
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff'},
    icon: {
        width: 26,
        alignItems: 'flex-start',
        marginRight: 180,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3366FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    addText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    searchInput: {
        marginTop: 20,
        backgroundColor: '#f1f1f1',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberRole: {
        fontSize: 14,
        color: '#666',
    },
})

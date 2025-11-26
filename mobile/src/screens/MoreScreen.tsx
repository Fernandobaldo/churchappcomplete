import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'

export default function MoreScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []

    const generalOptions = [
        { label: 'Meu Perfil', icon: <Ionicons name="person-outline" size={20} />, screen: 'ProfileScreen' },
        { label: 'Minhas Contribuições', icon: <Ionicons name="heart-outline" size={20} />, screen: 'MyContributions' },
        { label: 'Estudos Bíblicos / Devocional', icon: <Ionicons name="book-outline" size={20} />, screen: 'Devotionals' },
        { label: 'Configurações do App', icon: <Ionicons name="settings-outline" size={20} />, screen: 'AppSettings' },
        { label: 'Membros', icon: <Ionicons name="settings-outline" size={20} />, screen: 'MembersListScreen' },
    ]

    const adminOptions = [
        { label: 'Gestão de Membros', icon: <Ionicons name="people-outline" size={20} />, screen: 'Members', permission: 'members_manage' },
        { label: 'Gestão de Finanças', icon: <Ionicons name="cash-outline" size={20} />, screen: 'Finances', permission: 'finances_manage' },
        { label: 'Gestão de Eventos', icon: <Ionicons name="calendar-outline" size={20} />, screen: 'Events', permission: 'events_manage' },
        { label: 'Painel Administrativo', icon: <MaterialIcons name="admin-panel-settings" size={20} />, screen: 'AdminPanel', permission: 'admin_access' },
        { label: 'Convites e Cadastro de Membros', icon: <FontAwesome5 name="user-plus" size={18} />, screen: 'InviteLink', permission: 'members_manage' },
        { label: 'Permissões e Hierarquias', icon: <Feather name="lock" size={20} />, screen: 'Permissions', permission: 'members_manage' },



    ]

    const hasAccess = (required: string) =>
        user?.role === 'ADMINGERAL' ||
        user?.role === 'ADMINFILIAL' ||
        permissions.includes(required)

    const filteredAdminOptions = adminOptions.filter(opt => hasAccess(opt.permission))

    const handleNavigate = (screen: string) => {
        navigation.navigate(screen as never)
    }

    return (
        <View style={styles.container}>
            {generalOptions.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.row} onPress={() => handleNavigate(item.screen)}>
                    <View style={styles.icon}>{item.icon}</View>
                    <Text style={styles.label}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
            ))}

            {filteredAdminOptions.length > 0 && (
                <>
                    <Text style={styles.sectionHeader}>Para líderes e administradores</Text>
                    {filteredAdminOptions.map((item, idx) => (
                        <TouchableOpacity key={idx} style={styles.row} onPress={() => handleNavigate(item.screen)}>
                            <View style={styles.icon}>{item.icon}</View>
                            <Text style={styles.label}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </>
            )}

            <TouchableOpacity style={styles.logoutRow} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 60,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#999',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#f2f2f2',
    },
    icon: {
        width: 26,
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    logoutRow: {
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    logoutText: {
        fontSize: 16,
        color: '#d00',
        fontWeight: '500',
    },
})

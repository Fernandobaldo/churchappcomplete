import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import PageHeader from '../components/PageHeader'

export default function MoreScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []

    const generalOptions = [
        { label: 'Meu Perfil', icon: <Ionicons name="person-outline" size={20} />, screen: 'ProfileScreen' },
        { label: 'Minhas Contribuições', icon: <Ionicons name="heart-outline" size={20} />, screen: 'MyContributions' },
        { label: 'Estudos Bíblicos / Devocional', icon: <Ionicons name="book-outline" size={20} />, screen: 'Devotionals' },
        { label: 'Configurações do App', icon: <Ionicons name="settings-outline" size={20} />, screen: 'AppSettings' },
    ]

    const adminOptions = [
        { label: 'Finanças', icon: <Ionicons name="cash-outline" size={20} />, screen: 'Finances', permission: 'finances_manage' },
        { label: 'Permissões', icon: <Feather name="lock" size={20} />, screen: 'Permissions', permission: 'MANAGE_PERMISSIONS' },
        { label: 'Igreja', icon: <Ionicons name="church-outline" size={20} />, screen: 'ChurchSettings', permission: 'church_manage' },
        { label: 'Membros', icon: <Ionicons name="people-outline" size={20} />, screen: 'MembersListScreen', permission: 'members_manage' },
        { label: 'Gestão de Eventos', icon: <Ionicons name="calendar-outline" size={20} />, screen: 'Events', permission: 'events_manage' },
        { label: 'Painel Administrativo', icon: <MaterialIcons name="admin-panel-settings" size={20} />, screen: 'AdminPanel', permission: 'admin_access' },
        { label: 'Convites e Cadastro de Membros', icon: <Ionicons name="person-add-outline" size={20} />, screen: 'InviteLinks', permission: 'members_manage' },
    ]

    const hasPermission = (required: string | undefined) => {
        if (!required) return true
        return user?.role === 'ADMINGERAL' ||
            user?.role === 'ADMINFILIAL' ||
            hasAccess(user, required) ||
            permissions.includes(required)
    }

    const filteredAdminOptions = adminOptions.filter(opt => hasPermission(opt.permission))

    const handleNavigate = (screen: string) => {
        navigation.navigate(screen as never)
    }

    return (
        <View style={styles.container}>
            <PageHeader title="Mais" />
            <ScrollView style={styles.scrollView}>
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

                <TouchableOpacity style={styles.logoutRow} onPress={() => navigation.navigate('Login' as never)}>
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 110, // Altura do header fixo
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

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import { colors } from '../theme/colors'
import { useBackToDashboard } from '../hooks/useBackToDashboard'

export default function MoreScreen() {
    const navigation = useNavigation()
    const user = useAuthStore((s) => s.user)
    const permissions = user?.permissions?.map((p) => p.type) || []
    
    // Intercepta gesto de voltar para navegar ao Dashboard quando não há página anterior
    useBackToDashboard()

    const generalOptions = [
        { label: 'Meu Perfil', icon: <Ionicons name="person-outline" size={20} />, screen: 'ProfileScreen' },
        { label: 'Minhas Contribuições', icon: <Ionicons name="heart-outline" size={20} />, screen: 'MyContributions' },
        { label: 'Estudos Bíblicos / Devocional', icon: <Ionicons name="book-outline" size={20} />, screen: 'Devotionals' },
        { label: 'Minha Assinatura', icon: <Ionicons name="card-outline" size={20} />, screen: 'Subscription' },
        { label: 'Configurações do App', icon: <Ionicons name="settings-outline" size={20} />, screen: 'AppSettings' },
    ]

    const adminOptions = [
        { label: 'Finanças', icon: <Ionicons name="cash-outline" size={20} />, screen: 'Finances', permission: 'finances_manage' },
        { label: 'Permissões', icon: <Feather name="lock" size={20} />, screen: 'Permissions', permission: 'MANAGE_PERMISSIONS' },
        { label: 'Igreja', icon: <Ionicons name="church-outline" size={20} />, screen: 'ChurchSettings', permission: 'church_manage' },
        { label: 'Membros', icon: <Ionicons name="people-outline" size={20} />, screen: 'MembersListScreen', permission: 'members_manage' },
        { label: 'Gestão de Eventos', icon: <Ionicons name="calendar-outline" size={20} />, screen: 'Events', permission: 'events_manage' },
        { label: 'Cargos', icon: <Ionicons name="shield-outline" size={20} />, screen: 'Positions', role: 'ADMINGERAL' },
        { label: 'Painel Administrativo', icon: <MaterialIcons name="admin-panel-settings" size={20} />, screen: 'AdminPanel', permission: 'admin_access' },
        { label: 'Convites e Cadastro de Membros', icon: <Ionicons name="person-add-outline" size={20} />, screen: 'InviteLinks', permission: 'members_manage' },
    ]

    const hasPermission = (required: string | undefined, role?: string) => {
        if (role) {
            return user?.role === role
        }
        if (!required) return true
        return user?.role === 'ADMINGERAL' ||
            user?.role === 'ADMINFILIAL' ||
            hasAccess(user, required) ||
            permissions.includes(required)
    }

    const filteredAdminOptions = adminOptions.filter(opt => hasPermission(opt.permission, (opt as any).role))

    const handleNavigate = (screen: string) => {
        navigation.navigate(screen as never)
    }

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Mais",
            }}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {generalOptions.map((item, idx) => (
                    <GlassCard
                        key={idx}
                        onPress={() => handleNavigate(item.screen)}
                        opacity={0.4}
                        blurIntensity={20}
                        borderRadius={20}
                        style={styles.card}
                    >
                        <View style={styles.row}>
                            <View style={styles.icon}>{item.icon}</View>
                            <Text style={styles.label}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                        </View>
                    </GlassCard>
                ))}

                {filteredAdminOptions.length > 0 && (
                    <>
                        <Text style={styles.sectionHeader}>Para líderes e administradores</Text>
                        {filteredAdminOptions.map((item, idx) => (
                            <GlassCard
                                key={idx}
                                onPress={() => handleNavigate(item.screen)}
                                opacity={0.4}
                                blurIntensity={20}
                                borderRadius={20}
                                style={styles.card}
                            >
                                <View style={styles.row}>
                                    <View style={styles.icon}>{item.icon}</View>
                                    <Text style={styles.label}>{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                                </View>
                            </GlassCard>
                        ))}
                    </>
                )}

                <GlassCard
                    onPress={() => navigation.navigate('Login' as never)}
                    opacity={0.4}
                    blurIntensity={20}
                    borderRadius={20}
                    style={styles.logoutCard}
                >
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </GlassCard>
            </ScrollView>
        </ViewScreenLayout>
    )
}


const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        padding: 1,
        paddingBottom: 100,
    },
    card: {
        padding: 0,
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        color: '#64748B',
        paddingHorizontal: 4,
        paddingTop: 20,
        paddingBottom: 8,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    icon: {
        width: 26,
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        flex: 1,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#0F172A',
    },
    logoutCard: {
        padding: 0,
        marginTop: 20,
        marginBottom: 32,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
        color: '#EF4444',
        paddingVertical: 18,
        paddingHorizontal: 20,
        textAlign: 'center',
    },
})

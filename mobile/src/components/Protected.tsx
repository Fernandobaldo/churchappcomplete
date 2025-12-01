import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import { Ionicons } from '@expo/vector-icons'

type ProtectedProps = {
    permission: string
    children: React.ReactNode
}

export default function Protected({ permission, children }: ProtectedProps) {
    const user = useAuthStore((s) => s.user)
    const navigation = useNavigation()

    if (!hasAccess(user, permission)) {
        return (
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Ionicons name="shield-x" size={48} color="#EF4444" />
                </View>
                <Text style={styles.title}>Acesso Negado</Text>
                <Text style={styles.message}>
                    Você não tem permissão para acessar esta área.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Dashboard' as never)}
                >
                    <Text style={styles.buttonText}>Voltar ao Dashboard</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return <>{children}</>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

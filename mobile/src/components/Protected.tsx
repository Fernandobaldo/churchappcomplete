import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'

type ProtectedProps = {
    permission: string
    children: React.ReactNode
}

export default function Protected({ permission, children }: ProtectedProps) {
    const user = useAuthStore((s) => s.user)

    if (!hasAccess(user, permission)) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Você não tem permissão para acessar esta área.
                </Text>
            </View>
        )
    }

    return <>{children}</>
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    message: {
        color: '#ef4444',
        fontSize: 16,
        textAlign: 'center',
    },
})

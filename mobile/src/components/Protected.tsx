import React from 'react'
import { View, Text } from 'react-native'
import { useAuthStore } from '../stores/authStore'

type ProtectedProps = {
    permission: string
    children: React.ReactNode
}

export default function Protected({ permission, children }: ProtectedProps) {
    const user = useAuthStore((s) => s.user)

    if (!user?.permissions?.includes(permission)) {
        return (
            <View style={{ padding: 20 }}>
                <Text style={{ color: 'red' }}>Você não tem permissão para acessar esta área.</Text>
            </View>
        )
    }

    return <>{children}</>
}

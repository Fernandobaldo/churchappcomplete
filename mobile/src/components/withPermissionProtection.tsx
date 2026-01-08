import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { hasAccess, hasAnyAccess, hasRole, hasAnyRole } from '../utils/authUtils'
import ForbiddenScreen from '../screens/ForbiddenScreen'

interface PermissionProtectionOptions {
    permission?: string | string[]
    role?: string | string[]
    requireOnboarding?: boolean
}

/**
 * HOC para proteger screens baseado em permissões ou roles
 * Similar ao PermissionProtectedRoute do web, mas adaptado para React Navigation
 */
export function withPermissionProtection<P extends object>(
    Component: React.ComponentType<P>,
    options: PermissionProtectionOptions = {}
) {
    const { permission, role, requireOnboarding = true } = options

    return function ProtectedComponent(props: P) {
        const { token, user } = useAuthStore()
        const navigation = useNavigation()

        // Verifica autenticação
        if (!token) {
            React.useEffect(() => {
                navigation.navigate('Login' as never)
            }, [])
            return null
        }

        // Verifica onboarding
        if (requireOnboarding && (!user?.branchId || !user?.role)) {
            React.useEffect(() => {
                navigation.navigate('StartOnboarding' as never)
            }, [])
            return null
        }

        // Se não há permissão nem role especificada, permite acesso
        if (!permission && !role) {
            return <Component {...props} />
        }

        // Verifica role primeiro (se especificado)
        if (role) {
            const hasRequiredRole = Array.isArray(role)
                ? hasAnyRole(user, role)
                : hasRole(user, role)

            if (!hasRequiredRole) {
                return <ForbiddenScreen />
            }
        }

        // Verifica permissão (se especificado)
        if (permission) {
            const hasPermission = Array.isArray(permission)
                ? hasAnyAccess(user, permission)
                : hasAccess(user, permission)

            if (!hasPermission) {
                return <ForbiddenScreen />
            }
        }

        return <Component {...props} />
    }
}



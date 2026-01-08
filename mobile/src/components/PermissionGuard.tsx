import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { hasAccess, hasAnyAccess } from '../utils/authUtils'

interface PermissionGuardProps {
    children: React.ReactNode
    permission: string | string[]
    fallback?: React.ReactNode
}

/**
 * Componente que renderiza children condicionalmente baseado em permissão
 * Similar ao PermissionGuard do web, mas adaptado para React Native
 */
export default function PermissionGuard({
    children,
    permission,
    fallback = null,
}: PermissionGuardProps) {
    const { user } = useAuthStore()

    // Se não há usuário, não renderiza
    if (!user) {
        return <>{fallback}</>
    }

    // Verifica permissão
    const hasPermission = Array.isArray(permission)
        ? hasAnyAccess(user, permission)
        : hasAccess(user, permission)

    if (!hasPermission) {
        return <>{fallback}</>
    }

    return <>{children}</>
}



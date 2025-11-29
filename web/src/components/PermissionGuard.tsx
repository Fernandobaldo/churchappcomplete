import { useAuthStore } from '../stores/authStore'
import { hasAccess, hasAnyAccess } from '../utils/authUtils'

interface PermissionGuardProps {
  children: React.ReactNode
  permission: string | string[]
  fallback?: React.ReactNode
}

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


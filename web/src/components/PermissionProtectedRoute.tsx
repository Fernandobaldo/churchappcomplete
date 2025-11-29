import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { hasAccess, hasAnyAccess, hasRole, hasAnyRole } from '../utils/authUtils'
import Forbidden from '../pages/Forbidden'

interface PermissionProtectedRouteProps {
  children: React.ReactNode
  permission?: string | string[]
  role?: string | string[]
  requireOnboarding?: boolean
}

export default function PermissionProtectedRoute({
  children,
  permission,
  role,
  requireOnboarding = true,
}: PermissionProtectedRouteProps) {
  const { token, user } = useAuthStore()

  // Verifica autenticação
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Verifica onboarding
  if (requireOnboarding && (!user?.branchId || !user?.role)) {
    return <Navigate to="/onboarding/start" replace />
  }

  // Se não há permissão nem role especificada, permite acesso
  if (!permission && !role) {
    return <>{children}</>
  }

  // Verifica role primeiro (se especificado)
  if (role) {
    const hasRequiredRole = Array.isArray(role)
      ? hasAnyRole(user, role)
      : hasRole(user, role)
    
    if (!hasRequiredRole) {
      return <Forbidden />
    }
  }

  // Verifica permissão (se especificado)
  if (permission) {
    const hasPermission = Array.isArray(permission)
      ? hasAnyAccess(user, permission)
      : hasAccess(user, permission)

    if (!hasPermission) {
      return <Forbidden />
    }
  }

  return <>{children}</>
}


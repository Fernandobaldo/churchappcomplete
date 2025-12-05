import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '../stores/adminAuthStore'
import { AdminRole } from '../types'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: AdminRole[]
}

export function AdminProtectedRoute({
  children,
  allowedRoles,
}: AdminProtectedRouteProps) {
  const { isAuthenticated, adminUser, checkAuth } = useAdminAuthStore()
  const location = useLocation()

  // Verifica autenticação
  if (!isAuthenticated || !adminUser || !checkAuth()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Verifica permissões por role
  if (allowedRoles && !allowedRoles.includes(adminUser.adminRole)) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return <>{children}</>
}


import { useAdminAuthStore } from '../stores/adminAuthStore'
import { AdminRole } from '../types'

interface PermissionGuardProps {
  children: React.ReactNode
  allowedRoles: AdminRole[]
  fallback?: React.ReactNode
}

export function PermissionGuard({
  children,
  allowedRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { adminUser } = useAdminAuthStore()

  if (!adminUser || !allowedRoles.includes(adminUser.adminRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}


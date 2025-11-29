import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = true 
}: ProtectedRouteProps) {
  const { token, user } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Se tem token mas não completou onboarding, redireciona para onboarding
  if (requireOnboarding && (!user?.branchId || !user?.role)) {
    return <Navigate to="/onboarding/start" replace />
  }

  return <>{children}</>
}


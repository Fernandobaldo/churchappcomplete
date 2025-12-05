import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AdminLayout } from './components/AdminLayout'
import { AdminLogin } from './pages/AdminLogin'
import { Forbidden } from './pages/Forbidden'
import { Dashboard } from './pages/Dashboard'
import { UsersList } from './pages/Users'
import { UserDetails } from './pages/Users/UserDetails'
import { ChurchesList } from './pages/Churches'
import { MembersList } from './pages/Members'
import { SubscriptionsList } from './pages/Subscriptions'
import { SystemSettings } from './pages/Settings'
import { AuditLogs } from './pages/Audit'
import { WhiteLabel } from './pages/WhiteLabel'
import { PlansList } from './pages/Plans'
import { PlanForm } from './pages/Plans/PlanForm'
import { PlanDetails } from './pages/Plans/PlanDetails'
import { SubscriptionDetails } from './pages/Subscriptions/SubscriptionDetails'
import { PlansAndSubscriptions } from './pages/PlansAndSubscriptions'
import { AdminRole } from './types'
import { useAdminAuthStore } from './stores/adminAuthStore'

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: AdminRole[] }) {
  return (
    <AdminProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>{children}</AdminLayout>
    </AdminProtectedRoute>
  )
}

function App() {
  const { isAuthenticated, checkAuth } = useAdminAuthStore()
  
  // Verifica autenticação na inicialização
  React.useEffect(() => {
    checkAuth()
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}>
              <UsersList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}>
              <UserDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/churches"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}>
              <ChurchesList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}>
              <MembersList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans-subscriptions"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.FINANCE]}>
              <PlansAndSubscriptions />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.FINANCE]}>
              <SubscriptionsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT, AdminRole.FINANCE]}>
              <PlansList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans/new"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN]}>
              <PlanForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans/:id"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT, AdminRole.FINANCE]}>
              <PlanDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans/:id/edit"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN]}>
              <PlanForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/:id"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN, AdminRole.FINANCE]}>
              <SubscriptionDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/white-label"
          element={
            <PrivateRoute>
              <WhiteLabel />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN]}>
              <SystemSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <PrivateRoute allowedRoles={[AdminRole.SUPERADMIN]}>
              <AuditLogs />
            </PrivateRoute>
          }
        />
        <Route path="/admin/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import BemVindo from './pages/onboarding/BemVindo'
import Start from './pages/onboarding/Start'
import Church from './pages/onboarding/Church'
import Branches from './pages/onboarding/Branches'
import Settings from './pages/onboarding/Settings'
import Igreja from './pages/onboarding/Igreja'
import Filial from './pages/onboarding/Filial'
import Convites from './pages/onboarding/Convites'
import Concluido from './pages/onboarding/Concluido'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import EventDetails from './pages/Events/EventDetails'
import AddEvent from './pages/Events/AddEvent'
import EditEvent from './pages/Events/EditEvent'
import Contributions from './pages/Contributions'
import AddContribution from './pages/Contributions/AddContribution'
import ContributionDetails from './pages/Contributions/ContributionDetails'
import Devotionals from './pages/Devotionals'
import DevotionalDetails from './pages/Devotionals/DevotionalDetails'
import AddDevotional from './pages/Devotionals/AddDevotional'
import Members from './pages/Members'
import MemberDetails from './pages/Members/MemberDetails'
import AddMember from './pages/Members/AddMember'
import Permissions from './pages/Permissions'
import Profile from './pages/Profile'
import Finances from './pages/Finances'
import AddTransaction from './pages/Finances/AddTransaction'
import Notices from './pages/Notices'
import AddNotice from './pages/Notices/AddNotice'
import ChurchSettings from './pages/ChurchSettings'
import RegisterInvite from './pages/RegisterInvite'
import MemberLimitReached from './pages/MemberLimitReached'
import InviteLinks from './pages/Members/InviteLinks'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionProtectedRoute from './components/PermissionProtectedRoute'

// Componente para rotas públicas que redirecionam se já autenticado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  
  if (token) {
    // Se tem token mas não completou onboarding, redireciona para onboarding
    if (!user?.branchId || !user?.role) {
      return <Navigate to="/onboarding/start" replace />
    }
    // Se completou onboarding, redireciona para dashboard
    return <Navigate to="/app/dashboard" replace />
  }
  
  return <>{children}</>
}

// Componente para rotas de onboarding - permite acesso mesmo com token
// mas redireciona para dashboard se o onboarding já foi completado (tem branchId/role)
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  
  // Se não tem token, permite acesso (usuário pode estar no meio do registro)
  if (!token) {
    return <>{children}</>
  }
  
  // Se tem token mas não tem branchId/role, ainda está no onboarding
  // Permite continuar o onboarding
  if (token && (!user?.branchId || !user?.role)) {
    return <>{children}</>
  }
  
  // Se já completou onboarding (tem branchId e role), redireciona para dashboard
  if (token && user?.branchId && user?.role) {
    return <Navigate to="/app/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Rotas públicas (registro e login) - redirecionam se já autenticado */}
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/register/invite/:token" element={<RegisterInvite />} />
        <Route path="/member-limit-reached" element={<MemberLimitReached />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        {/* Rotas de onboarding - permitem acesso mesmo com token se onboarding não completo */}
        <Route path="/onboarding/bem-vindo" element={<OnboardingRoute><BemVindo /></OnboardingRoute>} />
        <Route path="/onboarding/start" element={<OnboardingRoute><Start /></OnboardingRoute>} />
        <Route path="/onboarding/church" element={<OnboardingRoute><Church /></OnboardingRoute>} />
        <Route path="/onboarding/branches" element={<OnboardingRoute><Branches /></OnboardingRoute>} />
        <Route path="/onboarding/settings" element={<OnboardingRoute><Settings /></OnboardingRoute>} />
        {/* Rotas antigas mantidas para compatibilidade */}
        <Route path="/onboarding/igreja" element={<OnboardingRoute><Igreja /></OnboardingRoute>} />
        <Route path="/onboarding/filial" element={<OnboardingRoute><Filial /></OnboardingRoute>} />
        <Route path="/onboarding/convites" element={<OnboardingRoute><Convites /></OnboardingRoute>} />
        <Route path="/onboarding/concluido" element={<OnboardingRoute><Concluido /></OnboardingRoute>} />
        
        {/* Rotas protegidas (app) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/new" element={<PermissionProtectedRoute permission="events_manage"><AddEvent /></PermissionProtectedRoute>} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="events/:id/edit" element={<PermissionProtectedRoute permission="events_manage"><EditEvent /></PermissionProtectedRoute>} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="contributions/new" element={<PermissionProtectedRoute permission="contributions_manage"><AddContribution /></PermissionProtectedRoute>} />
          <Route path="contributions/:id" element={<ContributionDetails />} />
          <Route path="devotionals" element={<Devotionals />} />
          <Route path="devotionals/new" element={<PermissionProtectedRoute permission="devotional_manage"><AddDevotional /></PermissionProtectedRoute>} />
          <Route path="devotionals/:id" element={<DevotionalDetails />} />
          <Route path="members" element={<Members />} />
          <Route path="members/new" element={<PermissionProtectedRoute permission="members_manage"><AddMember /></PermissionProtectedRoute>} />
          <Route path="members/invite-links" element={<PermissionProtectedRoute permission="members_manage"><InviteLinks /></PermissionProtectedRoute>} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="finances" element={<Finances />} />
          <Route path="finances/new" element={<PermissionProtectedRoute permission="finances_manage"><AddTransaction /></PermissionProtectedRoute>} />
          <Route path="notices" element={<Notices />} />
          <Route path="notices/new" element={<AddNotice />} />
          <Route path="church-settings" element={<PermissionProtectedRoute permission="church_manage"><ChurchSettings /></PermissionProtectedRoute>} />
          <Route path="permissions" element={<PermissionProtectedRoute role={['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']}><Permissions /></PermissionProtectedRoute>} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Redireciona /dashboard antigo para /app/dashboard */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        
        {/* Rota raiz redireciona para dashboard se autenticado, senão para login */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


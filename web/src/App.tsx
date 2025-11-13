import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
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
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { token } = useAuthStore()

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/new" element={<AddEvent />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="events/:id/edit" element={<EditEvent />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="contributions/new" element={<AddContribution />} />
          <Route path="contributions/:id" element={<ContributionDetails />} />
          <Route path="devotionals" element={<Devotionals />} />
          <Route path="devotionals/new" element={<AddDevotional />} />
          <Route path="devotionals/:id" element={<DevotionalDetails />} />
          <Route path="members" element={<Members />} />
          <Route path="members/new" element={<AddMember />} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


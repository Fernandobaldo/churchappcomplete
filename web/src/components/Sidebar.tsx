import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  Heart, 
  BookOpen, 
  Users, 
  Shield,
  User
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const menuItems = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app/events', icon: Calendar, label: 'Eventos' },
  { path: '/app/contributions', icon: Heart, label: 'Contribuições' },
  { path: '/app/devotionals', icon: BookOpen, label: 'Devocionais' },
  { path: '/app/members', icon: Users, label: 'Membros' },
  { path: '/app/permissions', icon: Shield, label: 'Permissões' },
  { path: '/app/profile', icon: User, label: 'Perfil' },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const permissions = user?.permissions?.map((p) => p.type) || []

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.path === '/app/permissions') {
      return permissions.includes('MANAGE_PERMISSIONS') || user?.role === 'ADMINGERAL'
    }
    return true
  })

  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}


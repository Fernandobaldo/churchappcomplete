import { NavLink } from 'react-router-dom'
import { useAdminAuthStore } from '../stores/adminAuthStore'
import {
  LayoutDashboard,
  Users,
  Church,
  CreditCard,
  UserCheck,
  Smartphone,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { PermissionGuard } from './PermissionGuard'
import { AdminRole } from '../types'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  allowedRoles: AdminRole[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.SUPPORT, AdminRole.FINANCE] },
  { name: 'Usuários', href: '/admin/users', icon: Users, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.SUPPORT] },
  { name: 'Igrejas', href: '/admin/churches', icon: Church, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.SUPPORT] },
  { name: 'Planos & Assinaturas', href: '/admin/plans-subscriptions', icon: CreditCard, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.FINANCE] },
  { name: 'Membros', href: '/admin/members', icon: UserCheck, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.SUPPORT] },
  { name: 'Apps White-label', href: '/admin/white-label', icon: Smartphone, allowedRoles: [AdminRole.SUPERADMIN, AdminRole.SUPPORT, AdminRole.FINANCE] },
  { name: 'Configurações', href: '/admin/settings', icon: Settings, allowedRoles: [AdminRole.SUPERADMIN] },
  { name: 'Segurança / Logs', href: '/admin/audit', icon: Shield, allowedRoles: [AdminRole.SUPERADMIN] },
]

export function AdminSidebar() {
  const { adminUser } = useAdminAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!adminUser) {
    return null
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-100"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Portal Admin</h2>
            <p className="text-sm text-gray-500 mt-1">ChurchApp SaaS</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <PermissionGuard
                key={item.name}
                allowedRoles={item.allowedRoles}
                fallback={null}
              >
                <NavLink
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-admin-light text-admin-dark font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              </PermissionGuard>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}


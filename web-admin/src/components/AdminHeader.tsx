import { useAdminAuthStore } from '../stores/adminAuthStore'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AdminHeader() {
  const { adminUser, logout } = useAdminAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      logout()
      navigate('/admin/login')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Portal Admin - ChurchApp SaaS
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-5 h-5" />
            <span className="font-medium">{adminUser?.name}</span>
            <span className="text-gray-500">({adminUser?.adminRole})</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}


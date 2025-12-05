import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/adminApi'
import { DashboardStats } from '../types'
import { Users, Church, MapPin, UserCheck, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  'data-testid': testId,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
  'data-testid'?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-3 bg-admin-light rounded-lg">
          <Icon className="w-8 h-8 text-admin-dark" />
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error: any) {
      toast.error('Erro ao carregar estatísticas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visão geral do sistema
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats-cards">
        <StatCard
          title="Total de Usuários"
          data-testid="dashboard-stat-users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          title="Total de Igrejas"
          value={stats.totalChurches}
          icon={Church}
          data-testid="dashboard-stat-churches"
        />
        <StatCard
          title="Total de Filiais"
          value={stats.totalBranches}
          icon={MapPin}
          data-testid="dashboard-stat-branches"
        />
        <StatCard
          title="Total de Membros"
          value={stats.totalMembers}
          icon={UserCheck}
          data-testid="dashboard-stat-members"
        />
      </div>

      {/* Novos usuários e igrejas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Novos Usuários</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Últimos 7 dias</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.newUsersLast7Days}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Últimos 30 dias</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.newUsersLast30Days}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Novas Igrejas</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Últimos 7 dias</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.newChurchesLast7Days}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Últimos 30 dias</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.newChurchesLast30Days}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Igrejas por plano */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Igrejas por Plano</h2>
        <div className="space-y-2">
          {stats.churchesByPlan.map((item) => (
            <div key={item.planName} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{item.planName}</span>
              <span className="text-sm font-semibold text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


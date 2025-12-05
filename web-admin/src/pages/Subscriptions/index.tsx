import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchInput } from '../../components/SearchInput'
import { FilterPanel } from '../../components/FilterPanel'
import { SubscriptionCard } from '../../components/SubscriptionCard'
import { subscriptionsApi } from '../../api/adminApi'
import { Subscription, PaginationParams } from '../../types'
import toast from 'react-hot-toast'
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react'

export function SubscriptionsList() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Resetar paginação para página 1 quando search ou filtros mudarem
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [search, statusFilter, planFilter])

  useEffect(() => {
    loadSubscriptions()
  }, [pagination.page, search, statusFilter, planFilter])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await subscriptionsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        planId: planFilter || undefined,
      })
      setSubscriptions(response.subscriptions || [])
      setPagination({
        page: response.page || response.pagination?.page || pagination.page,
        limit: response.limit || response.pagination?.limit || pagination.limit,
        total: response.total || response.pagination?.total || 0,
        totalPages: response.totalPages || response.pagination?.totalPages || Math.ceil((response.total || response.pagination?.total || 0) / (response.limit || response.pagination?.limit || 50)),
      })
    } catch (error: any) {
      toast.error('Erro ao carregar assinaturas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assinaturas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie todas as assinaturas do sistema
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por usuário..."
        className="max-w-md"
      />

      {showFilters && (
        <FilterPanel isOpen={showFilters} onClose={() => setShowFilters(false)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
            >
              <option value="">Todos</option>
              <option value="pending">Aguardando Pagamento</option>
              <option value="active">Ativa</option>
              <option value="past_due">Pagamento Atrasado</option>
              <option value="canceled">Cancelada</option>
              <option value="unpaid">Não Pago</option>
              <option value="trialing">Período de Teste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano
            </label>
            <input
              type="text"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              placeholder="ID do plano"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
            />
          </div>
        </FilterPanel>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma assinatura encontrada</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onClick={() => navigate(`/admin/subscriptions/${subscription.id}`)}
              />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} até{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} resultados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

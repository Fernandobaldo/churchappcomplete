import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { SearchInput } from '../../components/SearchInput'
import { FilterPanel } from '../../components/FilterPanel'
import { StatusBadge } from '../../components/StatusBadge'
import { churchesApi } from '../../api/adminApi'
import { Church, PaginationParams } from '../../types'
import toast from 'react-hot-toast'
import { Filter } from 'lucide-react'

export function ChurchesList() {
  const navigate = useNavigate()
  const [churches, setChurches] = useState<Church[]>([])
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
    loadChurches()
  }, [pagination.page, search, statusFilter, planFilter])

  const loadChurches = async () => {
    try {
      setLoading(true)
      const response = await churchesApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        name: search || undefined,
        status: statusFilter || undefined,
        planId: planFilter || undefined,
      })
      setChurches(response.churches || [])
      setPagination({
        page: response.page || pagination.page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 50)),
      })
    } catch (error: any) {
      toast.error('Erro ao carregar igrejas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      header: 'Nome',
      accessor: 'name' as keyof Church,
    },
    {
      header: 'Dono',
      accessor: (row: Church) => row.owner?.name || 'N/A',
    },
    {
      header: 'Plano',
      accessor: (row: Church) => row.plan?.name || 'N/A',
    },
    {
      header: 'Filiais',
      accessor: (row: Church) => row.branchesCount || 0,
    },
    {
      header: 'Membros',
      accessor: (row: Church) => row.membersCount || 0,
    },
    {
      header: 'Status',
      accessor: (row: Church) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'suspended'}
          variant={row.isActive ? 'success' : 'danger'}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Igrejas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie todas as igrejas do sistema
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          data-testid="churches-filter-toggle"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome da igreja..."
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
              data-testid="churches-filter-status"
            >
              <option value="">Todos</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
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

      <DataTable
        data={churches}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination({ ...pagination, page }),
        }}
        onRowClick={(church) => navigate(`/admin/churches/${church.id}`)}
      />
    </div>
  )
}

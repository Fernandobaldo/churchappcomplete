import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { SearchInput } from '../../components/SearchInput'
import { FilterPanel } from '../../components/FilterPanel'
import { StatusBadge } from '../../components/StatusBadge'
import { usersApi } from '../../api/adminApi'
import { User, PaginationParams } from '../../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Filter, Eye } from 'lucide-react'

export function UsersList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
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
    loadUsers()
  }, [pagination.page, search, statusFilter, planFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        planId: planFilter || undefined,
      })
      setUsers(response.users || [])
      setPagination({
        page: response.page || pagination.page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 50)),
      })
    } catch (error: any) {
      toast.error('Erro ao carregar usuários')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      header: 'Nome',
      accessor: 'name' as keyof User,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof User,
    },
    {
      header: 'Data de Criação',
      accessor: (row: User) =>
        format(new Date(row.createdAt), "dd/MM/yyyy", { locale: ptBR }),
    },
    {
      header: 'Status',
      accessor: (row: User) => (
        <StatusBadge
          status={row.isBlocked ? 'blocked' : 'active'}
          variant={row.isBlocked ? 'danger' : 'success'}
        />
      ),
    },
    {
      header: 'Igrejas',
      accessor: (row: User) => row.churchesCount || 0,
    },
    {
      header: 'Plano',
      accessor: (row: User) => row.plan?.name || 'N/A',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          data-testid="users-filter-toggle"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome ou email..."
        className="max-w-md"
        data-testid="users-search-input"
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
              data-testid="users-filter-status"
            >
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="blocked">Bloqueado</option>
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
        data={users}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination({ ...pagination, page }),
        }}
        onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { DataTable } from '../../components/DataTable'
import { SearchInput } from '../../components/SearchInput'
import { FilterPanel } from '../../components/FilterPanel'
import { auditApi } from '../../api/adminApi'
import { AuditLogEntry, PaginationParams } from '../../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Filter } from 'lucide-react'

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [adminFilter, setAdminFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Resetar paginação para página 1 quando filtros mudarem
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [adminFilter, actionFilter])

  useEffect(() => {
    loadLogs()
  }, [pagination.page, adminFilter, actionFilter])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await auditApi.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        adminUserId: adminFilter || undefined,
        action: actionFilter || undefined,
      })
      setLogs(response.logs || [])
      setPagination({
        page: response.page || pagination.page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 50)),
      })
    } catch (error: any) {
      toast.error('Erro ao carregar logs de auditoria')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      header: 'Data',
      accessor: (row: AuditLogEntry) =>
        format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      header: 'Admin',
      accessor: (row: AuditLogEntry) =>
        row.adminUser?.name || 'Sistema',
    },
    {
      header: 'Ação',
      accessor: 'action' as keyof AuditLogEntry,
    },
    {
      header: 'Descrição',
      accessor: 'description' as keyof AuditLogEntry,
    },
    {
      header: 'Entidade',
      accessor: (row: AuditLogEntry) =>
        `${row.entityType}${row.entityId ? ` #${row.entityId}` : ''}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe todas as ações administrativas do sistema
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

      {showFilters && (
        <FilterPanel isOpen={showFilters} onClose={() => setShowFilters(false)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin
            </label>
            <input
              type="text"
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              placeholder="ID do admin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ação
            </label>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Tipo de ação"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
            />
          </div>
        </FilterPanel>
      )}

      <DataTable
        data={logs}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination({ ...pagination, page }),
        }}
      />
    </div>
  )
}

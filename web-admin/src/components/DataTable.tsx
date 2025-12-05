import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="data-table-loading">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="data-table">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                  data-testid={`data-table-header-${index}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-gray-500"
                  data-testid="data-table-empty"
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  data-testid={`data-table-row-${row.id}`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.className || ''
                      }`}
                      data-testid={`data-table-cell-${row.id}-${index}`}
                    >
                      {typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : String(row[column.accessor] || '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} até{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="data-table-pagination-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700" data-testid="data-table-pagination-info">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="data-table-pagination-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



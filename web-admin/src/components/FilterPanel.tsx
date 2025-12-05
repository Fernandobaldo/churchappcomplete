import { ReactNode } from 'react'
import { Filter, X } from 'lucide-react'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function FilterPanel({ isOpen, onClose, title = 'Filtros', children }: FilterPanelProps) {
  if (!isOpen) return null

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200" data-testid="filter-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  )
}



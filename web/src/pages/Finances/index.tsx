import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { useAuthStore } from '../../stores/authStore'
import PermissionGuard from '../../components/PermissionGuard'

interface Transaction {
  id: string
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category: string | null
  branchId: string
  createdAt: string
  updatedAt: string
}

interface FinanceSummary {
  total: number
  entries: number
  exits: number
}

interface FinanceResponse {
  transactions: Transaction[]
  summary: FinanceSummary
}

export default function Finances() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState<FinanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinances()
  }, [])

  const fetchFinances = async () => {
    try {
      const response = await api.get('/finances')
      setData(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar finanças'
      toast.error(errorMessage)
      console.error('Erro ao carregar finanças:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Nenhum dado disponível</div>
      </div>
    )
  }

  const { transactions, summary } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-600 mt-1">Gestão financeira da filial</p>
        </div>
        <PermissionGuard permission="finances_manage">
          <button
            onClick={() => navigate('/app/finances/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </PermissionGuard>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p className={`text-2xl font-bold ${summary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {summary.total.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {summary.entries.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saídas</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {summary.exits.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transações</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma transação cadastrada</p>
            <PermissionGuard permission="finances_manage">
              <button
                onClick={() => navigate('/app/finances/new')}
                className="mt-4 text-primary hover:underline"
              >
                Criar primeira transação
              </button>
            </PermissionGuard>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{transaction.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {transaction.category || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'ENTRY'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'ENTRY' ? '+' : '-'}R${' '}
                        {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {format(new Date(transaction.createdAt), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}




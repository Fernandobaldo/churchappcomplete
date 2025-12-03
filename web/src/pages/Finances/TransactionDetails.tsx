import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

interface Transaction {
  id: string
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category: string | null
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | null
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | null
  exitTypeOther?: string | null
  contributionId?: string | null
  tithePayerMemberId?: string | null
  tithePayerName?: string | null
  isTithePayerMember?: boolean | null
  createdBy?: string | null
  branchId: string
  createdAt: string
  updatedAt: string
  CreatedByUser?: {
    id: string
    name: string
    email: string
  } | null
  Contribution?: {
    id: string
    title: string
    description: string | null
  } | null
  TithePayerMember?: {
    id: string
    name: string
    email: string
  } | null
}

export default function TransactionDetails() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  const fetchTransaction = async () => {
    try {
      const response = await api.get(`/finances/${id}`)
      setTransaction(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar transação'
      toast.error(errorMessage)
      console.error('Erro ao carregar transação:', error)
      const params = searchParams.toString()
      navigate(`/app/finances${params ? `?${params}` : ''}`)
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

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Transação não encontrada</div>
      </div>
    )
  }

  const getEntryTypeLabel = (type: string | null | undefined) => {
    const labels: Record<string, string> = {
      OFERTA: 'Oferta',
      DIZIMO: 'Dízimo',
      CONTRIBUICAO: 'Contribuição',
    }
    return labels[type || ''] || type
  }

  const getExitTypeLabel = (type: string | null | undefined) => {
    const labels: Record<string, string> = {
      ALUGUEL: 'Aluguel',
      ENERGIA: 'Energia',
      AGUA: 'Água',
      INTERNET: 'Internet',
      OUTROS: 'Outros',
    }
    return labels[type || ''] || type
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          const params = searchParams.toString()
          navigate(`/app/finances${params ? `?${params}` : ''}`)
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Detalhes da Transação</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <p data-testid="transaction-title" className="text-gray-900 font-medium">{transaction.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <p data-testid="transaction-amount" className={`text-2xl font-bold ${transaction.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'ENTRY' ? '+' : '-'}R${' '}
              {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <span
              data-testid="transaction-type"
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                transaction.type === 'ENTRY'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {transaction.type === 'ENTRY' ? 'Entrada' : 'Saída'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <p data-testid="transaction-category" className="text-gray-900">{transaction.category || 'Sem categoria'}</p>
          </div>

          {transaction.type === 'ENTRY' && transaction.entryType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrada</label>
              <p data-testid="transaction-entry-type" className="text-gray-900">{getEntryTypeLabel(transaction.entryType)}</p>
            </div>
          )}

          {transaction.type === 'EXIT' && transaction.exitType && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Saída</label>
                <p data-testid="transaction-exit-type" className="text-gray-900">{getExitTypeLabel(transaction.exitType)}</p>
              </div>
              {transaction.exitType === 'OUTROS' && transaction.exitTypeOther && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <p data-testid="transaction-exit-type-other" className="text-gray-900">{transaction.exitTypeOther}</p>
                </div>
              )}
            </>
          )}

          {transaction.entryType === 'CONTRIBUICAO' && transaction.Contribution && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribuição Vinculada</label>
                <p data-testid="contribution-linked-title" className="text-gray-900">{transaction.Contribution.title}</p>
                {transaction.Contribution.description && (
                  <p data-testid="contribution-linked-description" className="text-sm text-gray-600 mt-1">{transaction.Contribution.description}</p>
                )}
              </div>
              {/* Mostrar contribuinte se houver informação */}
              {(transaction.TithePayerMember || transaction.tithePayerName || transaction.tithePayerMemberId) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contribuinte</label>
                  <p data-testid="contributor-name" className="text-gray-900">
                    {transaction.TithePayerMember?.name || transaction.tithePayerName || transaction.tithePayerMemberId || 'N/A'}
                  </p>
                </div>
              )}
            </>
          )}

          {transaction.entryType === 'DIZIMO' && (
            <>
              {transaction.isTithePayerMember && transaction.tithePayerMemberId ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dizimista (Membro)</label>
                  <p className="text-gray-900">
                    {transaction.TithePayerMember?.name || transaction.tithePayerMemberId}
                  </p>
                </div>
              ) : (
                transaction.tithePayerName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dizimista</label>
                    <p className="text-gray-900">{transaction.tithePayerName}</p>
                  </div>
                )
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
            <p className="text-gray-900">
              {format(new Date(transaction.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Última Atualização</label>
            <p className="text-gray-900">
              {format(new Date(transaction.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>

          {transaction.CreatedByUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criado por</label>
              <p className="text-gray-900">{transaction.CreatedByUser.name}</p>
              <p className="text-sm text-gray-600">{transaction.CreatedByUser.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


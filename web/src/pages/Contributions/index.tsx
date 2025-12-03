import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Heart, DollarSign } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'

interface Contribution {
  id: string
  title: string
  description: string
  goal?: number
  endDate?: string
  raised?: number
  isActive: boolean
  PaymentMethods?: Array<{
    id: string
    type: string
    data: Record<string, any>
  }>
}

export default function Contributions() {
  const navigate = useNavigate()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContributions()
  }, [])

  const fetchContributions = async () => {
    try {
      const response = await api.get('/contributions')
      setContributions(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar contribuições'
      toast.error(errorMessage)
      console.error('Erro ao carregar contribuições:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeContributions = contributions.filter(c => c.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando contribuições...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contribuições</h1>
          <p className="text-gray-600 mt-1">Gerencie as contribuições da igreja</p>
        </div>
        <PermissionGuard permission="contributions_manage">
          <button onClick={() => navigate('/app/contributions/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Contribuição
          </button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="bg-primary-light p-3 rounded-lg">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contribuições Ativas</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeContributions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {contributions.length === 0 ? (
        <div className="card text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nenhuma contribuição cadastrada</p>
          <PermissionGuard permission="contributions_manage">
            <button onClick={() => navigate('/app/contributions/new')} className="btn-primary">
              Adicionar Primeira Contribuição
            </button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Lista de Contribuições</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Título</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Meta</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Arrecadado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Término</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{contribution.title}</p>
                        {contribution.description && (
                          <p className="text-sm text-gray-600">{contribution.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {contribution.goal ? (
                        <>R$ {contribution.goal.toFixed(2).replace('.', ',')}</>
                      ) : (
                        <span className="text-gray-400">Sem meta</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {contribution.raised ? (
                        <>R$ {contribution.raised.toFixed(2).replace('.', ',')}</>
                      ) : (
                        <span className="text-gray-400">R$ 0,00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {contribution.endDate ? (
                        format(new Date(contribution.endDate), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span className="text-gray-400">Sem data</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contribution.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contribution.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/app/contributions/${contribution.id}`)}
                        className="text-primary hover:underline text-sm"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


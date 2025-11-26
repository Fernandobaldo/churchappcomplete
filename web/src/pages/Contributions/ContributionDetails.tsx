import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, Calendar, Tag } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

interface Contribution {
  id: string
  title: string
  description: string
  value: number
  date: string
  type: 'OFERTA' | 'DIZIMO' | 'OUTRO'
}

export default function ContributionDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchContribution()
    }
  }, [id])

  const fetchContribution = async () => {
    try {
      const response = await api.get(`/contributions/${id}`)
      setContribution(response.data)
    } catch (error) {
      toast.error('Erro ao carregar contribuição')
      navigate('/app/contributions')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OFERTA: 'Oferta',
      DIZIMO: 'Dízimo',
      OUTRO: 'Outro',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      OFERTA: 'bg-blue-100 text-blue-800',
      DIZIMO: 'bg-green-100 text-green-800',
      OUTRO: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!contribution) {
    return null
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/contributions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">{contribution.title}</h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {contribution.value.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(contribution.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-lg">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getTypeColor(contribution.type)}`}>
                  {getTypeLabel(contribution.type)}
                </span>
              </div>
            </div>
          </div>

          {contribution.description && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{contribution.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


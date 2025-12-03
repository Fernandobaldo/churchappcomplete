import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, Calendar, CreditCard, Power } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'

interface PaymentMethod {
  id: string
  type: string
  data: Record<string, any>
}

interface Contribution {
  id: string
  title: string
  description: string
  goal?: number
  endDate?: string
  raised?: number
  isActive: boolean
  PaymentMethods?: PaymentMethod[]
}

export default function ContributionDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

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
      toast.error('Erro ao carregar campanha')
      navigate('/app/contributions')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    if (!id) return
    
    try {
      setToggling(true)
      const response = await api.patch(`/contributions/${id}/toggle-active`)
      setContribution(response.data)
      toast.success(`Campanha ${response.data.isActive ? 'ativada' : 'desativada'} com sucesso!`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status da campanha')
    } finally {
      setToggling(false)
    }
  }

  const getPaymentMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      PIX: 'PIX',
      CONTA_BR: 'Conta Bancária Brasileira',
      IBAN: 'IBAN',
    }
    return labels[type] || type
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
        onClick={() => navigate('/app/contributions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{contribution.title}</h1>
          <PermissionGuard permission="contributions_manage">
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                contribution.isActive
                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              <Power className="w-4 h-4" />
              {contribution.isActive ? 'Desativar' : 'Ativar'} Campanha
            </button>
          </PermissionGuard>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Meta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contribution.goal ? (
                    <>R$ {contribution.goal.toFixed(2).replace('.', ',')}</>
                  ) : (
                    <span className="text-gray-400">Sem meta</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrecadado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(contribution.raised || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-primary-light p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data de Término</p>
                <p className="text-lg font-semibold text-gray-900">
                  {contribution.endDate ? (
                    format(new Date(contribution.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span className="text-gray-400">Sem data definida</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              contribution.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {contribution.isActive ? 'Campanha Ativa' : 'Campanha Inativa'}
            </span>
          </div>

          {contribution.description && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{contribution.description}</p>
            </div>
          )}

          {contribution.PaymentMethods && contribution.PaymentMethods.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Formas de Pagamento
              </h3>
              <div className="space-y-3">
                {contribution.PaymentMethods.map((pm) => (
                  <div key={pm.id} className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {getPaymentMethodLabel(pm.type)}
                    </h4>
                    {pm.type === 'PIX' && (
                      <div className="space-y-1 text-sm text-gray-600">
                        {pm.data.chave && <p><strong>Chave:</strong> {pm.data.chave}</p>}
                        {pm.data.qrCodeUrl && (
                          <p><strong>QR Code:</strong> <a href={pm.data.qrCodeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pm.data.qrCodeUrl}</a></p>
                        )}
                      </div>
                    )}
                    {pm.type === 'CONTA_BR' && (
                      <div className="space-y-1 text-sm text-gray-600">
                        {pm.data.banco && <p><strong>Banco:</strong> {pm.data.banco}</p>}
                        {pm.data.agencia && <p><strong>Agência:</strong> {pm.data.agencia}</p>}
                        {pm.data.conta && <p><strong>Conta:</strong> {pm.data.conta}</p>}
                        {pm.data.tipo && <p><strong>Tipo:</strong> {pm.data.tipo}</p>}
                      </div>
                    )}
                    {pm.type === 'IBAN' && (
                      <div className="space-y-1 text-sm text-gray-600">
                        {pm.data.iban && <p><strong>IBAN:</strong> {pm.data.iban}</p>}
                        {pm.data.banco && <p><strong>Banco:</strong> {pm.data.banco}</p>}
                        {pm.data.nome && <p><strong>Titular:</strong> {pm.data.nome}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { subscriptionApi } from '../../api/api'
import { CheckCircle, XCircle, Clock, AlertCircle, CreditCard, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'

interface Subscription {
  id: string
  status: 'pending' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  plan: {
    id: string
    name: string
    price: number
  }
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  paymentHistory: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paidAt: string | null
  }>
}

const statusConfig = {
  pending: {
    label: 'Aguardando Pagamento',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  active: {
    label: 'Ativa',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  past_due: {
    label: 'Pagamento Atrasado',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  canceled: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  unpaid: {
    label: 'Não Pago',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  trialing: {
    label: 'Período de Teste',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const response = await subscriptionApi.getMySubscription()
      setSubscription(response.subscription)
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Usuário não tem assinatura
        setSubscription(null)
      } else {
        toast.error('Erro ao carregar assinatura')
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o fim do período atual.')) {
      return
    }

    try {
      setActionLoading(true)
      await subscriptionApi.cancel(true)
      toast.success('Assinatura cancelada. Você manterá acesso até o fim do período.')
      loadSubscription()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar assinatura')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    try {
      setActionLoading(true)
      await subscriptionApi.resume()
      toast.success('Assinatura retomada com sucesso!')
      loadSubscription()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao retomar assinatura')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount / 100) // Converter de centavos para reais
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!subscription) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma Assinatura Ativa
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não possui uma assinatura ativa. Escolha um plano para começar.
            </p>
            <button
              onClick={() => window.location.href = '/app/dashboard'}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Ver Planos
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const statusInfo = statusConfig[subscription.status]
  const StatusIcon = statusInfo.icon

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Assinatura</h1>
          <p className="text-gray-600 mt-1">Gerencie sua assinatura e visualize o histórico de pagamentos</p>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-lg shadow p-6 border-2 ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Status da Assinatura</h2>
                <p className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              </div>
            </div>
            {subscription.status === 'canceled' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Retomar Assinatura'}
              </button>
            )}
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Cancelar Assinatura'}
              </button>
            )}
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Sua assinatura será cancelada ao fim do período atual ({formatDate(subscription.currentPeriodEnd)})
              </p>
            </div>
          )}
        </div>

        {/* Plan Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plano</p>
              <p className="text-lg font-semibold text-gray-900">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Mensal</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(subscription.plan.price)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Período Atual</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Próxima Cobrança</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h2>
          {subscription.paymentHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum pagamento registrado ainda</p>
          ) : (
            <div className="space-y-3">
              {subscription.paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.paidAt ? formatDate(payment.paidAt) : 'Aguardando pagamento'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status === 'approved'
                        ? 'Pago'
                        : payment.status === 'pending'
                        ? 'Pendente'
                        : 'Falhou'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}


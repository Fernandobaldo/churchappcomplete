import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'
import { subscriptionApi } from '../../api/api'
import Layout from '../../components/Layout'

export default function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const response = await subscriptionApi.getMySubscription()
      setSubscription(response.subscription)
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      // Redirecionar para dashboard após 5 segundos
      const timer = setTimeout(() => {
        navigate('/app/dashboard')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [loading, navigate])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Assinatura Criada com Sucesso!
          </h1>

          <p className="text-gray-600 mb-6">
            {subscription?.status === 'pending' ? (
              <>
                Sua assinatura foi criada e está aguardando confirmação do pagamento.
                Você receberá um email assim que o pagamento for confirmado.
              </>
            ) : subscription?.status === 'trialing' ? (
              <>
                Você está no período de teste! Sua assinatura será ativada automaticamente
                após o período de teste.
              </>
            ) : (
              <>
                Sua assinatura está ativa! Você já pode usar todos os recursos do seu plano.
              </>
            )}
          </p>

          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-semibold text-gray-900">{subscription.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {subscription.status === 'pending' && 'Aguardando Pagamento'}
                    {subscription.status === 'active' && 'Ativa'}
                    {subscription.status === 'trialing' && 'Período de Teste'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => navigate('/app/subscription')}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Ver Detalhes da Assinatura
            </button>

            <button
              onClick={() => navigate('/app/dashboard')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Ir para Dashboard
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Você será redirecionado automaticamente em alguns segundos...
          </p>
        </div>
      </div>
    </Layout>
  )
}


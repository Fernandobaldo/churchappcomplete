import { X, Crown, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { subscriptionApi, plansApi } from '../api/api'
import toast from 'react-hot-toast'

interface PlanUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: {
    name: string
    maxMembers: number | null
  }
}

interface Plan {
  id: string
  name: string
  price: number
  maxMembers: number | null
  maxBranches: number | null
  features: string[]
  isActive: boolean
  popular?: boolean
}

export default function PlanUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPlans()
    }
  }, [isOpen])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await plansApi.getAll()
      // Filtrar apenas planos ativos e ordenar por preço
      const activePlans = (Array.isArray(response) ? response : response.plans || [])
        .filter((plan: Plan) => plan.isActive !== false)
        .sort((a: Plan, b: Plan) => a.price - b.price)
      
      // Marcar o plano do meio como popular (se houver 3+ planos)
      if (activePlans.length >= 3) {
        const middleIndex = Math.floor(activePlans.length / 2)
        activePlans[middleIndex].popular = true
      }
      
      setPlans(activePlans)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      const response = await subscriptionApi.checkout(planId, 7) // 7 dias de trial
      
      // Se houver checkoutUrl (MercadoPago), redirecionar
      if (response.subscription?.checkoutUrl) {
        toast.success('Redirecionando para o checkout...')
        window.location.href = response.subscription.checkoutUrl
      } else {
        // Se não houver (pagamento direto), mostrar sucesso
        toast.success('Assinatura criada com sucesso!')
        onClose()
        // Recarregar página para atualizar dados do usuário
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erro ao criar assinatura'
      toast.error(errorMessage)
      console.error('Erro ao fazer upgrade:', error)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade do Plano</h2>
            <p className="text-sm text-gray-600 mt-1">
              Seu plano atual atingiu o limite de membros. Escolha um plano superior para continuar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="p-6 bg-blue-50 border-b">
            <div className="flex items-center gap-2">
              <Crown className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-blue-900">
                Plano Atual: <span className="font-bold">{currentPlan.name}</span>
                {currentPlan.maxMembers && (
                  <span className="ml-2 text-blue-700">
                    (Limite: {currentPlan.maxMembers} membros)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Carregando planos...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Nenhum plano disponível</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.name.toLowerCase() === plan.name.toLowerCase()
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  className={`
                    relative border-2 rounded-lg p-6 transition-all cursor-pointer
                    ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${isCurrentPlan ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-md'}
                  `}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
                        ATUAL
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <span className="text-gray-600 text-sm">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isCurrentPlan) {
                        handleUpgrade(plan.id)
                      }
                    }}
                    disabled={isCurrentPlan || upgrading}
                    className={`
                      w-full py-2 px-4 rounded-lg font-medium transition-colors
                      ${
                        isCurrentPlan
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }
                      ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isCurrentPlan
                      ? 'Plano Atual'
                      : upgrading && selectedPlan === plan.id
                      ? 'Processando...'
                      : 'Escolher Plano'}
                  </button>
                </div>
              )
            })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Dica:</strong> Você pode fazer upgrade a qualquer momento. O valor será calculado proporcionalmente.
          </p>
        </div>
      </div>
    </div>
  )
}




import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { plansApi } from '../../api/adminApi'
import { FeatureToggle } from '../../components/FeatureToggle'
import { PlanFeature } from '../../types'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, X } from 'lucide-react'

export function PlanForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [availableFeatures, setAvailableFeatures] = useState<PlanFeature[]>([])
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    maxBranches: '' as string | number,
    maxMembers: '' as string | number,
    isActive: true,
    billingInterval: 'month' as 'month' | 'year' | 'week' | 'day',
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load canonical feature catalog from dedicated endpoint
      const featuresResponse = await plansApi.getFeatures()
      const features = featuresResponse.features || []
      setAvailableFeatures(features)

      if (isEditing && id) {
        try {
          const plan = await plansApi.getById(id)
          if (plan) {
            setFormData({
              name: plan.name,
              price: plan.price,
              maxBranches: plan.maxBranches || '',
              maxMembers: plan.maxMembers || '',
              isActive: plan.isActive !== false,
              billingInterval: (plan.billingInterval as 'month' | 'year' | 'week' | 'day') || 'month',
            })
            setSelectedFeatures(plan.features || [])
          }
        } catch (error) {
          console.error('Erro ao carregar plano:', error)
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, featureId])
    } else {
      // If editing and removing a feature, show warning
      if (isEditing && selectedFeatures.includes(featureId)) {
        const feature = availableFeatures.find(f => f.id === featureId)
        const confirmed = window.confirm(
          `Tem certeza que deseja remover a feature "${feature?.label || featureId}"?\n\n` +
          `Usuários com assinaturas ativas neste plano perderão acesso a esta funcionalidade imediatamente.`
        )
        if (!confirmed) {
          return // Cancel removal
        }
      }
      setSelectedFeatures(selectedFeatures.filter((id) => id !== featureId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome do plano é obrigatório')
      return
    }

    if (formData.price < 0) {
      toast.error('Preço deve ser maior ou igual a zero')
      return
    }

    if (selectedFeatures.length === 0) {
      toast.error('Selecione pelo menos uma feature')
      return
    }

    try {
      setSaving(true)
      const planData = {
        name: formData.name,
        price: formData.price,
        features: selectedFeatures,
        maxBranches: formData.maxBranches ? Number(formData.maxBranches) : undefined,
        maxMembers: formData.maxMembers ? Number(formData.maxMembers) : undefined,
        billingInterval: formData.billingInterval,
        ...(isEditing && { isActive: formData.isActive }),
      }

      if (isEditing && id) {
        await plansApi.update(id, planData)
        toast.success('Plano atualizado com sucesso')
      } else {
        await plansApi.create(planData)
        toast.success('Plano criado com sucesso')
      }
      navigate('/admin/plans-subscriptions')
    } catch (error: any) {
      // Handle feature validation errors with friendly messages
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error
        if (errorMessage.includes('Features inválidas') || errorMessage.includes('Invalid feature')) {
          toast.error(
            'Uma ou mais features selecionadas são inválidas. Por favor, recarregue a página e tente novamente.',
            { duration: 5000 }
          )
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error(error.response?.data?.error || 'Erro ao salvar plano')
      }
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/plans-subscriptions')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="plan-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Plano *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                placeholder="Ex: Free, Basic, Pro"
                data-testid="plan-form-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                placeholder="0.00"
                data-testid="plan-form-price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Filiais
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxBranches}
                onChange={(e) =>
                  setFormData({ ...formData, maxBranches: e.target.value || '' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                placeholder="Deixe vazio para ilimitado"
                data-testid="plan-form-max-branches"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Membros
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxMembers}
                onChange={(e) =>
                  setFormData({ ...formData, maxMembers: e.target.value || '' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                placeholder="Deixe vazio para ilimitado"
                data-testid="plan-form-max-members"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Cobrança *
              </label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({ ...formData, billingInterval: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                data-testid="plan-form-billing-interval"
              >
                <option value="month">Mensal</option>
                <option value="year">Anual</option>
                <option value="week">Semanal</option>
                <option value="day">Diário</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-admin border-gray-300 rounded focus:ring-admin"
                  data-testid="plan-form-is-active"
                />
                <span className="text-sm font-medium text-gray-700">Plano Ativo</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Planos inativos não podem receber novas assinaturas
              </p>
            </div>
          )}

          {/* Plan Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview do Plano</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium text-gray-900">{formData.name || '(sem nome)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-medium text-gray-900">
                  R$ {formData.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features selecionadas:</span>
                <span className="font-medium text-gray-900">{selectedFeatures.length}</span>
              </div>
              {selectedFeatures.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="text-gray-600 mb-1">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedFeatures.map((featureId) => {
                      const feature = availableFeatures.find(f => f.id === featureId)
                      return (
                        <span
                          key={featureId}
                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {feature?.label || featureId}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Features Incluídas *
            </label>
            
            {/* Group features by category */}
            {(() => {
              const basicFeatures = availableFeatures.filter(f => f.category === 'basic' || !f.category)
              const premiumFeatures = availableFeatures.filter(f => f.category === 'premium')
              
              return (
                <div className="space-y-6">
                  {basicFeatures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Features Básicas
                      </h4>
                      <div className="space-y-2">
                        {basicFeatures.map((feature) => (
                          <FeatureToggle
                            key={feature.id}
                            feature={feature}
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={(checked) => handleFeatureToggle(feature.id, checked)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {premiumFeatures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Features Premium
                      </h4>
                      <div className="space-y-2">
                        {premiumFeatures.map((feature) => (
                          <FeatureToggle
                            key={feature.id}
                            feature={feature}
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={(checked) => handleFeatureToggle(feature.id, checked)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
            
            {availableFeatures.length === 0 && (
              <p className="text-sm text-gray-500">Carregando features...</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-dark disabled:opacity-50"
              data-testid="plan-form-submit"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : isEditing ? 'Atualizar Plano' : 'Criar Plano'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/plans-subscriptions')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              data-testid="plan-form-cancel"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


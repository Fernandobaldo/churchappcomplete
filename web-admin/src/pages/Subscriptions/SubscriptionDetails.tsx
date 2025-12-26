import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscriptionsApi, plansApi } from '../../api/adminApi'
import { StatusBadge } from '../../components/StatusBadge'
import { ConfirmModal } from '../../components/ConfirmModal'
import { PermissionGuard } from '../../components/PermissionGuard'
import { AdminRole } from '../../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  User,
  Save,
  X,
  RotateCcw,
} from 'lucide-react'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

export function SubscriptionDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { adminUser } = useAdminAuthStore()
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [formData, setFormData] = useState({
    planId: '',
    status: '',
  })

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subData, plansData] = await Promise.all([
        subscriptionsApi.getById(id!),
        plansApi.getAll(),
      ])
      
      // Normalizar status: backend retorna 'canceled', frontend usa 'cancelled'
      const normalizedStatus = subData.status === 'canceled' ? 'cancelled' : subData.status
      
      setSubscription({
        ...subData,
        status: normalizedStatus,
      })
      setFormData({
        planId: subData.plan?.id || '',
        status: normalizedStatus || '',
      })
      // Backend retorna { plans, availableFeatures }
      setPlans((plansData.plans || plansData || []).filter((p: any) => p.isActive !== false))
    } catch (error: any) {
      toast.error('Erro ao carregar dados')
      navigate('/admin/plans-subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      if (formData.planId && formData.planId !== subscription.plan?.id) {
        await subscriptionsApi.changePlan(id!, formData.planId)
        toast.success('Plano alterado com sucesso')
      }
      if (formData.status && formData.status !== subscription.status) {
        // Normalizar status: frontend usa 'cancelled', backend espera 'canceled'
        const backendStatus = formData.status === 'cancelled' ? 'canceled' : formData.status
        await subscriptionsApi.updateStatus(id!, backendStatus)
        toast.success('Status atualizado com sucesso')
      }
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    try {
      setSaving(true)
      await subscriptionsApi.cancel(id!)
      toast.success('Assinatura cancelada com sucesso')
      setShowCancelModal(false)
      loadData()
    } catch (error: any) {
      toast.error('Erro ao cancelar assinatura')
    } finally {
      setSaving(false)
    }
  }

  const handleReactivate = async () => {
    try {
      setSaving(true)
      await subscriptionsApi.reactivate(id!)
      toast.success('Assinatura reativada com sucesso')
      setShowReactivateModal(false)
      loadData()
    } catch (error: any) {
      toast.error('Erro ao reativar assinatura')
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

  if (!subscription) {
    return null
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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes da Assinatura</h1>
            <p className="text-gray-600 mt-1">ID: {subscription.id}</p>
          </div>
          <StatusBadge
            status={subscription.status}
            variant={
              subscription.status === 'active'
                ? 'success'
                : subscription.status === 'cancelled'
                ? 'danger'
                : 'warning'
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Usuário
            </h3>
            <p className="text-gray-900 font-medium">{subscription.user?.name || subscription.userName}</p>
            <p className="text-sm text-gray-600">{subscription.user?.email || subscription.userEmail}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Plano Atual
            </h3>
            <p className="text-gray-900 font-medium">{subscription.plan?.name || subscription.planName}</p>
            <p className="text-sm text-gray-600">
              R$ {subscription.plan?.price?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Início
            </h3>
            <p className="text-gray-900">
              {format(new Date(subscription.startedAt), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          {subscription.endsAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Fim
              </h3>
              <p className="text-gray-900">
                {format(new Date(subscription.endsAt), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar Assinatura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              >
                <option value="">Selecione um plano</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              >
                <option value="active">Ativa</option>
                <option value="trialing">Trial</option>
                <option value="pending">Pendente</option>
                <option value="past_due">Pagamento Atrasado</option>
                <option value="cancelled">Cancelada</option>
                <option value="unpaid">Não Pago</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-dark disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
            {subscription.status !== 'cancelled' ? (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X className="w-4 h-4" />
                Cancelar Assinatura
              </button>
            ) : (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4" />
                Reativar Assinatura
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancelar Assinatura"
        message="Tem certeza que deseja cancelar esta assinatura?"
        confirmText="Cancelar Assinatura"
        variant="danger"
        loading={saving}
      />

      <ConfirmModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleReactivate}
        title="Reativar Assinatura"
        message="Tem certeza que deseja reativar esta assinatura?"
        confirmText="Reativar"
        variant="info"
        loading={saving}
      />
    </div>
  )
}


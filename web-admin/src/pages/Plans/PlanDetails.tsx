import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { plansApi } from '../../api/adminApi'
import { StatusBadge } from '../../components/StatusBadge'
import { ConfirmModal } from '../../components/ConfirmModal'
import { PermissionGuard } from '../../components/PermissionGuard'
import { AdminRole } from '../../types'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

export function PlanDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { adminUser } = useAdminAuthStore()
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadPlan()
    }
  }, [id])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const planData = await plansApi.getById(id!)
      setPlan(planData)
    } catch (error: any) {
      toast.error('Erro ao carregar plano')
      navigate('/admin/plans-subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    try {
      setActionLoading(true)
      await plansApi.activate(id!)
      toast.success('Plano ativado com sucesso')
      setShowActivateModal(false)
      loadPlan()
    } catch (error: any) {
      toast.error('Erro ao ativar plano')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    try {
      setActionLoading(true)
      await plansApi.deactivate(id!)
      toast.success('Plano desativado com sucesso')
      setShowDeactivateModal(false)
      loadPlan()
    } catch (error: any) {
      toast.error('Erro ao desativar plano')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!plan) {
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
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            <p className="text-gray-600 mt-1">
              R$ {plan.price.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              status={plan.isActive ? 'active' : 'inactive'}
              variant={plan.isActive ? 'success' : 'neutral'}
            />
            <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
              <button
                onClick={() => navigate(`/admin/plans/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-dark"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </PermissionGuard>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Máximo de Filiais
            </h3>
            <p className="text-gray-900 font-medium">
              {plan.maxBranches || 'Ilimitado'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Máximo de Membros
            </h3>
            <p className="text-gray-900 font-medium">
              {plan.maxMembers || 'Ilimitado'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Assinaturas Ativas
            </h3>
            <p className="text-gray-900 font-medium">
              {plan.activeSubscriptions || plan.subscriptionsCount || 0}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Incluídas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.features && plan.features.length > 0 ? (
              plan.features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">{feature}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhuma feature incluída</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
          <div className="flex gap-3">
            <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
              {plan.isActive ? (
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <PowerOff className="w-4 h-4" />
                  Desativar Plano
                </button>
              ) : (
                <button
                  onClick={() => setShowActivateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Power className="w-4 h-4" />
                  Ativar Plano
                </button>
              )}
            </PermissionGuard>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={handleActivate}
        title="Ativar Plano"
        message={`Tem certeza que deseja ativar o plano ${plan.name}? Ele ficará disponível para novas assinaturas.`}
        confirmText="Ativar"
        variant="info"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivate}
        title="Desativar Plano"
        message={`Tem certeza que deseja desativar o plano ${plan.name}? Ele não poderá receber novas assinaturas, mas as assinaturas existentes continuarão ativas.`}
        confirmText="Desativar"
        variant="warning"
        loading={actionLoading}
      />
    </div>
  )
}


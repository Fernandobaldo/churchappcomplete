import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { plansApi } from '../../api/adminApi'
import { Plan } from '../../types'
import toast from 'react-hot-toast'
import { Plus, Edit, Power, PowerOff, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { PermissionGuard } from '../../components/PermissionGuard'
import { AdminRole } from '../../types'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

export function PlansList() {
  const navigate = useNavigate()
  const { adminUser } = useAdminAuthStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await plansApi.getAll()
      // Backend retorna { plans, availableFeatures }
      setPlans(response.plans || response || [])
    } catch (error: any) {
      toast.error('Erro ao carregar planos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      setActionLoading(planId)
      if (isActive) {
        await plansApi.deactivate(planId)
        toast.success('Plano desativado com sucesso')
      } else {
        await plansApi.activate(planId)
        toast.success('Plano ativado com sucesso')
      }
      loadPlans()
    } catch (error: any) {
      toast.error('Erro ao alterar status do plano')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    {
      header: 'Nome',
      accessor: 'name' as keyof Plan,
    },
    {
      header: 'Preço',
      accessor: (row: Plan) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(row.price),
    },
    {
      header: 'Max Filiais',
      accessor: (row: Plan) => row.maxBranches || 'Ilimitado',
    },
    {
      header: 'Max Membros',
      accessor: (row: Plan) => row.maxMembers || 'Ilimitado',
    },
    {
      header: 'Recursos',
      accessor: (row: Plan) => row.features?.length || 0,
    },
    {
      header: 'Status',
      accessor: (row: Plan) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          variant={row.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    {
      header: 'Sincronização',
      accessor: (row: Plan) => {
        const syncStatus = row.syncStatus || 'pending'
        const getSyncIcon = () => {
          switch (syncStatus) {
            case 'synced':
              return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'error':
              return <XCircle className="w-4 h-4 text-red-600" />
            case 'pending':
              return <Clock className="w-4 h-4 text-yellow-600" />
            default:
              return <AlertCircle className="w-4 h-4 text-gray-400" />
          }
        }
        const getSyncLabel = () => {
          switch (syncStatus) {
            case 'synced':
              return 'Sincronizado'
            case 'error':
              return 'Erro'
            case 'pending':
              return 'Pendente'
            default:
              return 'Desconhecido'
          }
        }
        return (
          <div className="flex items-center gap-2">
            {getSyncIcon()}
            <span className="text-sm text-gray-700">{getSyncLabel()}</span>
          </div>
        )
      },
    },
    {
      header: 'Gateway',
      accessor: (row: Plan) => row.gatewayProvider || '-',
    },
    {
      header: 'Ações',
      accessor: (row: Plan) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/plans/${row.id}`)
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Ver detalhes"
          >
            <Edit className="w-4 h-4" />
          </button>
          {adminUser?.adminRole === AdminRole.SUPERADMIN && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleActive(row.id, row.isActive !== false)
              }}
              disabled={actionLoading === row.id}
              className={`p-2 rounded ${
                row.isActive
                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              } disabled:opacity-50`}
              title={row.isActive ? 'Desativar' : 'Ativar'}
            >
              {row.isActive ? (
                <PowerOff className="w-4 h-4" />
              ) : (
                <Power className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Planos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie os planos disponíveis no sistema
          </p>
        </div>
        <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
          <button
            onClick={() => navigate('/admin/plans/new')}
            className="flex items-center gap-2 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-dark"
          >
            <Plus className="w-4 h-4" />
            Novo Plano
          </button>
        </PermissionGuard>
      </div>

      <DataTable
        data={plans}
        columns={columns}
        loading={loading}
        onRowClick={(plan) => navigate(`/admin/plans/${plan.id}`)}
      />
    </div>
  )
}


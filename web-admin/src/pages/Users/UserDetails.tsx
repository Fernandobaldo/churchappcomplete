import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usersApi } from '../../api/adminApi'
import { StatusBadge } from '../../components/StatusBadge'
import { ConfirmModal } from '../../components/ConfirmModal'
import { PermissionGuard } from '../../components/PermissionGuard'
import { AdminRole } from '../../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  Key,
  UserCheck,
  Building2,
  CreditCard,
} from 'lucide-react'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

export function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { adminUser } = useAdminAuthStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showUnblockModal, setShowUnblockModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadUser()
    }
  }, [id])

  const loadUser = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getById(id!)
      setUser(data)
    } catch (error: any) {
      toast.error('Erro ao carregar usuário')
      navigate('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async () => {
    try {
      setActionLoading(true)
      await usersApi.block(id!)
      toast.success('Usuário bloqueado com sucesso')
      setShowBlockModal(false)
      loadUser()
    } catch (error: any) {
      toast.error('Erro ao bloquear usuário')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    try {
      setActionLoading(true)
      await usersApi.unblock(id!)
      toast.success('Usuário desbloqueado com sucesso')
      setShowUnblockModal(false)
      loadUser()
    } catch (error: any) {
      toast.error('Erro ao desbloquear usuário')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      setActionLoading(true)
      await usersApi.resetPassword(id!)
      toast.success('Link de reset de senha enviado')
      setShowResetModal(false)
    } catch (error: any) {
      toast.error('Erro ao enviar reset de senha')
    } finally {
      setActionLoading(false)
    }
  }

  const handleImpersonate = async () => {
    try {
      setActionLoading(true)
      const result = await usersApi.impersonate(id!)
      // Abre nova aba com token de impersonação
      const portalUrl = window.location.origin.replace(':3001', ':3000')
      window.open(`${portalUrl}/app?token=${result.token}`, '_blank')
      toast.success('Abrindo portal como usuário...')
      setShowImpersonateModal(false)
    } catch (error: any) {
      toast.error('Erro ao impersonar usuário')
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

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          <StatusBadge
            status={user.isBlocked ? 'blocked' : 'active'}
            variant={user.isBlocked ? 'danger' : 'success'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Data de Criação
            </h3>
            <p className="text-gray-900">
              {format(new Date(user.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <p className="text-gray-900">
              {user.isBlocked ? 'Bloqueado' : 'Ativo'}
            </p>
          </div>
        </div>

        {/* Igrejas */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Igrejas
          </h3>
          <div className="space-y-4">
            {user.churchesAsOwner && user.churchesAsOwner.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Como Dono:
                </h4>
                <ul className="space-y-2">
                  {user.churchesAsOwner.map((church: any) => (
                    <li
                      key={church.id}
                      className="p-3 bg-gray-50 rounded-lg"
                      onClick={() => navigate(`/admin/churches/${church.id}`)}
                    >
                      <p className="font-medium">{church.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {user.churchesAsMember && user.churchesAsMember.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Como Membro:
                </h4>
                <ul className="space-y-2">
                  {user.churchesAsMember.map((church: any) => (
                    <li key={church.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{church.name}</p>
                      <p className="text-sm text-gray-600">Role: {church.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(!user.churchesAsOwner || user.churchesAsOwner.length === 0) &&
              (!user.churchesAsMember || user.churchesAsMember.length === 0) && (
                <p className="text-gray-500">Nenhuma igreja associada</p>
              )}
          </div>
        </div>

        {/* Assinatura */}
        {user.subscription && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Assinatura
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plano</p>
                  <p className="font-medium">{user.subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={user.subscription.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Início</p>
                  <p className="font-medium">
                    {format(
                      new Date(user.subscription.startedAt),
                      'dd/MM/yyyy',
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                {user.subscription.endsAt && (
                  <div>
                    <p className="text-sm text-gray-600">Fim</p>
                    <p className="font-medium">
                      {format(
                        new Date(user.subscription.endsAt),
                        'dd/MM/yyyy',
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
          <div className="flex flex-wrap gap-3">
            <PermissionGuard allowedRoles={[AdminRole.SUPERADMIN]}>
              {user.isBlocked ? (
                <button
                  onClick={() => setShowUnblockModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  data-testid="user-details-unblock-button"
                >
                  <Shield className="w-4 h-4" />
                  Desbloquear
                </button>
              ) : (
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  data-testid="user-details-block-button"
                >
                  <ShieldOff className="w-4 h-4" />
                  Bloquear
                </button>
              )}
            </PermissionGuard>
            <PermissionGuard
              allowedRoles={[AdminRole.SUPERADMIN, AdminRole.SUPPORT]}
            >
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="user-details-reset-password-button"
              >
                <Key className="w-4 h-4" />
                Resetar Senha
              </button>
              <button
                onClick={() => setShowImpersonateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                data-testid="user-details-impersonate-button"
              >
                <UserCheck className="w-4 h-4" />
                Impersonar
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlock}
        title="Bloquear Usuário"
        message={`Tem certeza que deseja bloquear o usuário ${user.name}? Ele não poderá mais fazer login.`}
        confirmText="Bloquear"
        variant="danger"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={showUnblockModal}
        onClose={() => setShowUnblockModal(false)}
        onConfirm={handleUnblock}
        title="Desbloquear Usuário"
        message={`Tem certeza que deseja desbloquear o usuário ${user.name}?`}
        confirmText="Desbloquear"
        variant="info"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetPassword}
        title="Enviar Reset de Senha"
        message={`Deseja enviar um link de redefinição de senha para ${user.email}?`}
        confirmText="Enviar"
        variant="info"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
        onConfirm={handleImpersonate}
        title="Impersonar Usuário"
        message={`Deseja abrir o portal da igreja como ${user.name}? Uma nova aba será aberta.`}
        confirmText="Impersonar"
        variant="warning"
        loading={actionLoading}
      />
    </div>
  )
}



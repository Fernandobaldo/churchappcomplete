import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, Copy, Download, QrCode } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import PlanUpgradeModal from '../../components/PlanUpgradeModal'

interface InviteLink {
  id: string
  token: string
  branchId: string
  createdBy: string
  maxUses: number | null
  currentUses: number
  expiresAt: Date | null
  isActive: boolean
  createdAt: string
  creatorName?: string
  creatorEmail?: string | null
  Branch: {
    id: string
    name: string
    Church: {
      id: string
      name: string
    }
  }
  _count: {
    Member: number
  }
}

export default function InviteLinks() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [links, setLinks] = useState<InviteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<{ name: string; maxMembers: number | null } | undefined>()
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [formData, setFormData] = useState({
    maxUses: '' as string | number,
    expiresAt: '',
  })

  useEffect(() => {
    if (user?.branchId) {
      fetchLinks()
    }
  }, [user?.branchId])

  const fetchLinks = async () => {
    if (!user?.branchId) return

    try {
      setLoading(true)
      const response = await api.get(`/invite-links/branch/${user.branchId}`)
      // Garantir que sempre seja um array
      setLinks(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar links de convite')
      // Em caso de erro, garantir que links seja um array vazio
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!user?.branchId) {
      toast.error('Filial não identificada')
      return
    }

    try {
      setCreating(true)
      const payload: any = {
        branchId: user.branchId,
      }

      if (formData.maxUses && formData.maxUses !== '') {
        payload.maxUses = formData.maxUses === 'unlimited' ? null : parseInt(formData.maxUses as string)
      } else {
        payload.maxUses = null
      }

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString()
      } else {
        payload.expiresAt = null
      }

      await api.post('/invite-links', payload)
      toast.success('Link de convite criado com sucesso!')
      setShowCreateModal(false)
      setFormData({ maxUses: '', expiresAt: '' })
      fetchLinks()
    } catch (error: any) {
      if (error.response?.data?.code === 'PLAN_LIMIT_REACHED' || error.response?.data?.error === 'PLAN_LIMIT_REACHED') {
        // Buscar informações do plano atual
        try {
          const planResponse = await api.get('/subscriptions/current')
          setCurrentPlan({
            name: planResponse.data?.plan?.name || 'Free',
            maxMembers: planResponse.data?.plan?.maxMembers || null,
          })
        } catch {
          // Se não conseguir buscar, usa valores padrão
          setCurrentPlan({
            name: 'Free',
            maxMembers: 10,
          })
        }
        setShowUpgradeModal(true)
        toast.error('Limite de membros do plano atingido. Faça upgrade para continuar.')
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao criar link de convite')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (linkId: string) => {
    if (!confirm('Tem certeza que deseja desativar este link?')) {
      return
    }

    try {
      await api.patch(`/invite-links/${linkId}/deactivate`)
      toast.success('Link desativado com sucesso!')
      fetchLinks()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao desativar link')
    }
  }

  const handleCopyLink = (token: string) => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const inviteUrl = `${frontendUrl}/register/invite/${token}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Link copiado para a área de transferência!')
  }

  const handleDownloadPDF = (token: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'
    window.open(`${apiUrl}/invite-links/${token}/pdf`, '_blank')
    toast.success('PDF gerado com sucesso!')
  }

  const getQRCodeUrl = (token: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'
    return `${apiUrl}/invite-links/${token}/qrcode`
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Não expira'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isLimitReached = (link: InviteLink) => {
    if (link.maxUses === null) return false
    return link.currentUses >= link.maxUses
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando links de convite...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/members')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Link de Convite
        </button>
      </div>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Links de Convite</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ativos ({links.filter((l) => l.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'inactive'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Desativados ({links.filter((l) => !l.isActive).length})
          </button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum link de convite criado ainda.</p>
            <p className="mt-2">Clique em "Novo Link de Convite" para criar o primeiro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links
              .filter((link) => (activeTab === 'active' ? link.isActive : !link.isActive))
              .map((link) => (
              <div
                key={link.id}
                className={`border rounded-lg p-4 ${
                  !link.isActive || isExpired(link.expiresAt) || isLimitReached(link)
                    ? 'bg-gray-50 opacity-75'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Link de Convite</h3>
                      {!link.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                          Desativado
                        </span>
                      )}
                      {link.isActive && isExpired(link.expiresAt) && (
                        <span className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded">
                          Expirado
                        </span>
                      )}
                      {link.isActive && isLimitReached(link) && (
                        <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-700 rounded">
                          Limite Atingido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Igreja: <strong>{link.Branch.Church.name}</strong>
                    </p>
                    {link.creatorName && (
                      <p className="text-sm text-gray-600 mb-2">
                        Criado por: <strong>{link.creatorName}</strong>
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-2">
                      Criado em: {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Expira em: {formatDate(link.expiresAt)}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Usos: {link.currentUses} / {link.maxUses === null ? 'Ilimitado' : link.maxUses}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(link.token)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Copiar link"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <a
                      href={getQRCodeUrl(link.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Ver QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDownloadPDF(link.token)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {link.isActive && (
                      <button
                        onClick={() => handleDeactivate(link.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="Desativar link"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Link de Convite</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Usos
                </label>
                <select
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  className="input"
                >
                  <option value="unlimited">Ilimitado</option>
                  <option value="10">10 usos</option>
                  <option value="25">25 usos</option>
                  <option value="50">50 usos</option>
                  <option value="100">100 usos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Expiração (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ maxUses: '', expiresAt: '' })
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateLink}
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? 'Criando...' : 'Criar Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upgrade de Plano */}
      <PlanUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
      />
    </div>
  )
}


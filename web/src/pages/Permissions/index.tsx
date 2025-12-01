import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shield, Users, X, Plus } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface Member {
  id: string
  name: string
  email: string
  role: string
  permissions: Array<{ id: string; type: string }>
}

interface Permission {
  type: string
  description: string
}

// Mapeamento de permissões para descrições em português
const permissionDescriptions: Record<string, string> = {
  'devotional_manage': 'Gerenciar Devocionais',
  'members_view': 'Visualizar Membros',
  'members_manage': 'Gerenciar Membros',
  'events_manage': 'Gerenciar Eventos',
  'contributions_manage': 'Gerenciar Contribuições',
  'finances_manage': 'Gerenciar Finanças',
  'church_manage': 'Gerenciar Igreja',
}

export default function Permissions() {
  const [searchParams] = useSearchParams()
  const memberId = searchParams.get('memberId')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
    fetchAvailablePermissions()
  }, [])

  useEffect(() => {
    if (memberId && members.length > 0) {
      const member = members.find(m => m.id === memberId)
      if (member) {
        fetchMemberDetails(member.id)
      }
    }
  }, [memberId, members])

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members')
      // Garante que todos os membros tenham permissions como array
      const membersWithPermissions = response.data.map((member: Member) => ({
        ...member,
        permissions: member.permissions || []
      }))
      setMembers(membersWithPermissions)
    } catch (error) {
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePermissions = async () => {
    try {
      const response = await api.get('/permissions/all')
      const permissions = response.data.map((p: { type: string }) => ({
        type: p.type,
        description: permissionDescriptions[p.type] || p.type,
      }))
      setAvailablePermissions(permissions)
    } catch (error) {
      console.error('Erro ao carregar permissões disponíveis:', error)
      // Fallback para permissões padrão se a API falhar
      setAvailablePermissions([
        { type: 'devotional_manage', description: 'Gerenciar Devocionais' },
        { type: 'members_view', description: 'Visualizar Membros' },
        { type: 'members_manage', description: 'Gerenciar Membros' },
        { type: 'events_manage', description: 'Gerenciar Eventos' },
        { type: 'contributions_manage', description: 'Gerenciar Contribuições' },
        { type: 'finances_manage', description: 'Gerenciar Finanças' },
        { type: 'church_manage', description: 'Gerenciar Igreja' },
      ])
    }
  }

  const fetchMemberDetails = async (id: string) => {
    try {
      const response = await api.get(`/members/${id}`)
      const member = response.data
      // Garante que permissions seja sempre um array
      if (!member.permissions) {
        member.permissions = []
      }
      setSelectedMember(member)
    } catch (error) {
      toast.error('Erro ao carregar detalhes do membro')
    }
  }

  const handleMemberSelect = (member: Member) => {
    // Garante que permissions seja sempre um array
    const memberWithPermissions = {
      ...member,
      permissions: member.permissions || []
    }
    setSelectedMember(memberWithPermissions)
    fetchMemberDetails(member.id)
  }

  const togglePermission = async (permissionType: string) => {
    if (!selectedMember) return

    const currentPermissions = (selectedMember.permissions || []).map(p => p.type)
    const hasPermission = currentPermissions.includes(permissionType)

    // Cria o novo array de permissões
    const newPermissions = hasPermission
      ? currentPermissions.filter(p => p !== permissionType)
      : [...currentPermissions, permissionType]

    try {
      await api.post(`/permissions/${selectedMember.id}`, { permissions: newPermissions })
      toast.success(hasPermission ? 'Permissão removida com sucesso!' : 'Permissão adicionada com sucesso!')
      
      // Recarrega os detalhes do membro para obter as permissões atualizadas com IDs corretos
      await fetchMemberDetails(selectedMember.id)
      
      // Atualiza também na lista de membros
      const response = await api.get('/members')
      const membersWithPermissions = response.data.map((member: Member) => ({
        ...member,
        permissions: member.permissions || []
      }))
      setMembers(membersWithPermissions)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar permissão')
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Permissões</h1>
        <p className="text-gray-600 mt-1">Gerencie as permissões dos membros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedMember?.id === member.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{member.name}</p>
                  <p className={`text-sm ${selectedMember?.id === member.id ? 'text-white/80' : 'text-gray-600'}`}>
                    {member.email}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissões de {selectedMember.name}
                </h2>
                <span className="text-sm text-gray-500">
                  {(selectedMember.permissions || []).length} {(selectedMember.permissions || []).length === 1 ? 'permissão' : 'permissões'}
                </span>
              </div>
              
              {(selectedMember.permissions || []).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Permissões Atuais</h3>
                  <div className="space-y-2">
                    {(selectedMember.permissions || []).map((permission) => {
                      const permissionInfo = availablePermissions.find(p => p.type === permission.type)
                      return (
                        <div
                          key={permission.id || permission.type}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-green-900">
                              {permissionInfo?.description || permission.type}
                            </p>
                            <p className="text-xs text-green-700">{permission.type}</p>
                          </div>
                          <button
                            onClick={() => togglePermission(permission.type)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Remover permissão"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Permissão
                </h3>
                <div className="space-y-2">
                  {availablePermissions
                    .filter(permission => 
                      !(selectedMember.permissions || []).some(p => p.type === permission.type)
                    )
                    .map((permission) => (
                      <div
                        key={permission.type}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{permission.description}</p>
                          <p className="text-xs text-gray-600">{permission.type}</p>
                        </div>
                        <button
                          onClick={() => togglePermission(permission.type)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Adicionar permissão"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  {availablePermissions.every(permission => 
                    (selectedMember.permissions || []).some(p => p.type === permission.type)
                  ) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Todas as permissões disponíveis já foram atribuídas
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Selecione um membro para gerenciar permissões</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


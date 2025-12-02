import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shield, Users, CheckCircle2, Circle, Search } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

interface Member {
  id: string
  name: string
  email: string
  role: string
  permissions: Array<{ id: string; type: string }>
}

// Lista completa de permissões disponíveis
const ALL_PERMISSIONS = [
  { type: 'devotional_manage', label: 'Gerenciar Devocionais' },
  { type: 'members_view', label: 'Visualizar Membros' },
  { type: 'members_manage', label: 'Gerenciar Membros' },
  { type: 'events_manage', label: 'Gerenciar Eventos' },
  { type: 'contributions_manage', label: 'Gerenciar Contribuições' },
  { type: 'finances_manage', label: 'Gerenciar Finanças' },
  { type: 'church_manage', label: 'Gerenciar Igreja' },
]

const ROLE_LABELS: Record<string, string> = {
  MEMBER: 'Membro',
  COORDINATOR: 'Coordenador',
  ADMINFILIAL: 'Administrador de Filial',
  ADMINGERAL: 'Administrador Geral',
}

export default function Permissions() {
  const [searchParams] = useSearchParams()
  const memberId = searchParams.get('memberId')
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    console.log('[PERMISSIONS FRONTEND] useEffect - memberId:', memberId, 'members.length:', members.length)
    if (memberId && members.length > 0) {
      console.log('[PERMISSIONS FRONTEND] Buscando detalhes do membro da URL:', memberId)
      // Sempre busca os detalhes completos do membro para garantir que as permissões estejam atualizadas
      fetchMemberDetails(memberId)
    }
  }, [memberId, members])

  const fetchMembers = async () => {
    try {
      console.log('[PERMISSIONS FRONTEND] fetchMembers chamado')
      const response = await api.get('/members')
      console.log('[PERMISSIONS FRONTEND] Resposta bruta do GET /members:', response.data)
      // Garante que todos os membros tenham permissions como array
      const membersWithPermissions = response.data.map((member: Member) => {
        const processed = {
          ...member,
          permissions: Array.isArray(member.permissions) ? member.permissions : []
        }
        console.log(`[PERMISSIONS FRONTEND] Membro processado ${member.id} (${member.name}):`, {
          permissionsRaw: member.permissions,
          permissionsProcessed: processed.permissions,
          permissionsCount: processed.permissions.length
        })
        return processed
      })
      console.log('[PERMISSIONS FRONTEND] Todos os membros processados:', membersWithPermissions)
      setMembers(membersWithPermissions)
    } catch (error) {
      console.error('[Permissions] Erro ao carregar membros:', error)
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }


  const fetchMemberDetails = async (id: string) => {
    try {
      console.log('[PERMISSIONS FRONTEND] fetchMemberDetails chamado para membro:', id)
      const response = await api.get(`/members/${id}`)
      console.log('[PERMISSIONS FRONTEND] Resposta completa:', response)
      console.log('[PERMISSIONS FRONTEND] Resposta do GET /members/' + id + ':', response.data)
      console.log('[PERMISSIONS FRONTEND] Tipo de response.data:', typeof response.data)
      console.log('[PERMISSIONS FRONTEND] Tipo de permissions:', typeof response.data?.permissions)
      console.log('[PERMISSIONS FRONTEND] permissions é array?', Array.isArray(response.data?.permissions))
      console.log('[PERMISSIONS FRONTEND] Chaves do objeto response.data:', Object.keys(response.data || {}))
      console.log('[PERMISSIONS FRONTEND] response.data.permissions valor bruto:', response.data?.permissions)
      
      const member = { ...response.data } // Cria uma cópia para não modificar o original
      
      // Garante que permissions seja sempre um array válido
      // Verifica múltiplas formas que as permissões podem vir
      if (member.permissions) {
        if (Array.isArray(member.permissions)) {
          // Já é um array, garante que todos os itens têm a estrutura correta
          member.permissions = member.permissions.map((p: any) => {
            if (typeof p === 'string') {
              return { id: `temp-${p}`, type: p }
            }
            return p && typeof p === 'object' && p.type ? p : null
          }).filter(Boolean)
        } else if (typeof member.permissions === 'string') {
          // Se for string, tenta fazer parse
          try {
            const parsed = JSON.parse(member.permissions)
            member.permissions = Array.isArray(parsed) ? parsed : []
          } catch {
            member.permissions = []
          }
        } else {
          console.warn('[PERMISSIONS FRONTEND] Permissões em formato desconhecido:', member.permissions)
          member.permissions = []
        }
      } else {
        console.warn('[PERMISSIONS FRONTEND] Permissões ausentes, definindo como array vazio')
        member.permissions = []
      }
      
      console.log('[PERMISSIONS FRONTEND] Membro processado:', {
        id: member.id,
        name: member.name,
        permissions: member.permissions,
        permissionsCount: member.permissions?.length || 0
      })
      console.log('[PERMISSIONS FRONTEND] Detalhes das permissões do membro carregado:', JSON.stringify(member.permissions, null, 2))
      setSelectedMember(member)
    } catch (error) {
      console.error('[PERMISSIONS FRONTEND] Erro ao carregar detalhes do membro:', error)
      toast.error('Erro ao carregar detalhes do membro')
      setSelectedMember(null)
    }
  }

  const handleMemberSelect = (member: Member) => {
    console.log('[PERMISSIONS FRONTEND] handleMemberSelect chamado para membro:', member.id, member.name)
    console.log('[PERMISSIONS FRONTEND] Permissões do membro na lista:', member.permissions)
    // Sempre busca os detalhes completos do membro para garantir permissões atualizadas
    // Não usa os dados da lista para evitar problemas de sincronização
    fetchMemberDetails(member.id)
  }

  // Verifica se o membro é ADMINGERAL (tem todas as permissões automaticamente)
  const isAdminGeral = (member: Member | null) => member?.role === 'ADMINGERAL'

  // Retorna todas as permissões se for ADMINGERAL, senão retorna as permissões do membro
  const getEffectivePermissions = (member: Member | null) => {
    if (isAdminGeral(member)) {
      return ALL_PERMISSIONS.map(p => ({ id: `auto-${p.type}`, type: p.type }))
    }
    return member?.permissions || []
  }

  // Verifica se o usuário pode alterar roles
  const canChangeRole = (targetMember: Member | null) => {
    if (!user || !targetMember) return false
    
    // ADMINGERAL pode alterar roles de qualquer membro da igreja (exceto criar outro ADMINGERAL)
    if (user.role === 'ADMINGERAL') {
      return targetMember.role !== 'ADMINGERAL' // Não pode criar outro ADMINGERAL
    }
    
    // ADMINFILIAL pode alterar roles de membros da sua filial (apenas para COORDINATOR ou MEMBER)
    if (user.role === 'ADMINFILIAL') {
      return targetMember.role !== 'ADMINGERAL' && targetMember.role !== 'ADMINFILIAL'
    }
    
    // Outros roles não podem alterar roles
    return false
  }

  // Filtra membros por nome
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoleChange = async (newRole: string) => {
    if (!selectedMember) return

    // Não permite alterar para a mesma role
    if (selectedMember.role === newRole) return

    // Salva o estado original para possível reversão
    const originalRole = selectedMember.role

    // Atualização otimista do estado local
    setSelectedMember({
      ...selectedMember,
      role: newRole,
    })

    try {
      const response = await api.patch(`/members/${selectedMember.id}/role`, { role: newRole })
      
      // Atualiza o membro selecionado com os dados retornados pela API
      const updatedMember = {
        ...selectedMember,
        role: response.data.role,
        permissions: response.data.permissions || [],
      }
      
      setSelectedMember(updatedMember)

      // Atualiza também na lista de membros para manter sincronizado
      setMembers(members.map(m => 
        m.id === selectedMember.id 
          ? { ...m, role: response.data.role, permissions: response.data.permissions || [] }
          : m
      ))

      toast.success(`Role alterada para ${ROLE_LABELS[newRole] || newRole} com sucesso!`)
    } catch (error: any) {
      // Reverte a atualização otimista em caso de erro
      setSelectedMember({
        ...selectedMember,
        role: originalRole,
      })
      toast.error(error.response?.data?.error || 'Erro ao alterar role do membro')
    }
  }

  const togglePermission = async (permissionType: string) => {
    if (!selectedMember) return

    // ADMINGERAL não pode ter permissões removidas (tem todas automaticamente)
    if (isAdminGeral(selectedMember)) {
      toast.error('Administrador Geral possui todas as permissões automaticamente e não pode tê-las removidas.')
      return
    }

    // Salva o estado original para possível reversão
    const originalPermissions = [...(selectedMember.permissions || [])]
    const currentPermissions = originalPermissions.map(p => p.type)
    const hasPermission = currentPermissions.includes(permissionType)

    // Cria o novo array de permissões
    const newPermissions = hasPermission
      ? currentPermissions.filter(p => p !== permissionType)
      : [...currentPermissions, permissionType]

    // Atualização otimista do estado local
    const updatedPermissions = newPermissions.map(type => ({ id: `temp-${type}`, type }))
    setSelectedMember({
      ...selectedMember,
      permissions: updatedPermissions
    })

    try {
      const memberId = selectedMember.id
      console.log('[PERMISSIONS FRONTEND] Enviando POST com permissões:', newPermissions)
      
      const response = await api.post(`/permissions/${memberId}`, { permissions: newPermissions })
      console.log('[PERMISSIONS FRONTEND] Resposta do POST:', response.data)
      console.log('[PERMISSIONS FRONTEND] Permissões na resposta:', response.data?.permissions)
      console.log('[PERMISSIONS FRONTEND] Detalhes das permissões na resposta:', JSON.stringify(response.data?.permissions, null, 2))
      
      // Usa as permissões retornadas pela resposta do POST (se disponíveis)
      let updatedPermissions = response.data?.permissions
      
      // Se não vieram na resposta, busca do servidor para garantir dados atualizados
      if (!updatedPermissions || !Array.isArray(updatedPermissions)) {
        console.log('[PERMISSIONS FRONTEND] Permissões não vieram na resposta, fazendo GET /members/' + memberId)
        const memberResponse = await api.get(`/members/${memberId}`)
        console.log('[PERMISSIONS FRONTEND] Resposta do GET /members/' + memberId + ':', memberResponse.data)
        console.log('[PERMISSIONS FRONTEND] Permissões no GET:', memberResponse.data?.permissions)
        updatedPermissions = memberResponse.data?.permissions || []
      }
      
      console.log('[PERMISSIONS FRONTEND] Permissões finais que serão salvas no estado:', updatedPermissions)
      console.log('[PERMISSIONS FRONTEND] Detalhes das permissões finais:', JSON.stringify(updatedPermissions, null, 2))
      
      // Atualiza o membro selecionado com as permissões corretas do banco
      setSelectedMember({
        ...selectedMember,
        permissions: updatedPermissions
      })
      
      // Atualiza também na lista de membros para manter sincronizado
      console.log('[PERMISSIONS FRONTEND] Fazendo GET /members para atualizar lista')
      const membersResponse = await api.get('/members')
      console.log('[PERMISSIONS FRONTEND] Resposta do GET /members:', membersResponse.data)
      const membersWithPermissions = membersResponse.data.map((member: Member) => {
        console.log(`[PERMISSIONS FRONTEND] Membro ${member.id} (${member.name}):`, {
          permissionsCount: member.permissions?.length || 0,
          permissions: member.permissions
        })
        return {
          ...member,
          permissions: member.permissions || []
        }
      })
      setMembers(membersWithPermissions)
      
      toast.success(hasPermission ? 'Permissão removida com sucesso!' : 'Permissão adicionada com sucesso!')
    } catch (error: any) {
      // Reverte a atualização otimista em caso de erro
      setSelectedMember({
        ...selectedMember,
        permissions: originalPermissions
      })
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
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
                </p>
              ) : (
                filteredMembers.map((member) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  Permissões de {selectedMember.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Role:</span>
                    {canChangeRole(selectedMember) ? (
                      <select
                        value={selectedMember.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-semibold"
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => {
                          // ADMINGERAL não pode ser selecionado
                          if (value === 'ADMINGERAL') return null
                          // ADMINFILIAL só pode selecionar COORDINATOR ou MEMBER
                          if (user?.role === 'ADMINFILIAL' && (value === 'ADMINFILIAL' || value === 'ADMINGERAL')) {
                            return null
                          }
                          return (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                    ) : (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-sm">
                        {ROLE_LABELS[selectedMember.role] || selectedMember.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {isAdminGeral(selectedMember) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      ⚡ Administrador Geral possui todas as permissões automaticamente
                    </p>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Permissões Ativas
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {(() => {
                    const effectivePermissions = getEffectivePermissions(selectedMember)
                    return effectivePermissions.length > 0
                      ? `${effectivePermissions.length} permissão(ões) ativa(s)`
                      : 'Nenhuma permissão ativa'
                  })()}
                </p>

                {(() => {
                  const effectivePermissions = getEffectivePermissions(selectedMember)
                  return effectivePermissions.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {effectivePermissions.map((permission) => {
                          const permLabel = ALL_PERMISSIONS.find(p => p.type === permission.type)?.label || permission.type
                          return (
                            <span
                              key={permission.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {permLabel}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
                  {isAdminGeral(selectedMember) ? 'Permissões Disponíveis' : 'Atribuir Permissões'}
                </h3>
                <div className="space-y-3">
                  {ALL_PERMISSIONS.map((permission) => {
                    // Para ADMINGERAL, usa getEffectivePermissions. Para outros, usa as permissões reais do membro
                    const isAdmin = isAdminGeral(selectedMember)
                    // Garante que permissions seja sempre um array válido
                    const memberPermissions = Array.isArray(selectedMember.permissions) 
                      ? selectedMember.permissions 
                      : []
                    
                    // Debug: log das permissões para cada toggle
                    if (permission.type === 'devotional_manage') {
                      console.log(`[PERMISSIONS FRONTEND] Verificando toggle para ${permission.type}:`, {
                        selectedMemberId: selectedMember.id,
                        selectedMemberName: selectedMember.name,
                        isAdmin,
                        memberPermissions,
                        memberPermissionsTypes: memberPermissions.map(p => p?.type),
                        hasPermission: memberPermissions.some(p => p && p.type === permission.type),
                        selectedMemberPermissionsRaw: selectedMember.permissions
                      })
                    }
                    
                    const hasPermission = isAdmin
                      ? true // ADMINGERAL sempre tem todas as permissões
                      : memberPermissions.some(
                          p => p && p.type === permission.type
                        )
                    const isDisabled = isAdmin
                    
                    return (
                      <div
                        key={permission.type}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          hasPermission
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        } ${isDisabled ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {hasPermission ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`font-medium ${hasPermission ? 'text-green-900' : 'text-gray-900'}`}>
                              {permission.label}
                            </p>
                            <p className={`text-xs ${hasPermission ? 'text-green-700' : 'text-gray-500'}`}>
                              {permission.type}
                            </p>
                          </div>
                        </div>
                        <label className={`relative inline-flex items-center ml-4 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() => togglePermission(permission.type)}
                            disabled={isDisabled}
                            className="sr-only peer disabled:opacity-50"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        </label>
                      </div>
                    )
                  })}
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


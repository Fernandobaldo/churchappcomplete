import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shield, Users, Check, X } from 'lucide-react'
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

const availablePermissions: Permission[] = [
  { type: 'MANAGE_EVENTS', description: 'Gerenciar Eventos' },
  { type: 'MANAGE_CONTRIBUTIONS', description: 'Gerenciar Contribuições' },
  { type: 'MANAGE_DEVOTIONALS', description: 'Gerenciar Devocionais' },
  { type: 'MANAGE_MEMBERS', description: 'Gerenciar Membros' },
  { type: 'MANAGE_PERMISSIONS', description: 'Gerenciar Permissões' },
]

export default function Permissions() {
  const [searchParams] = useSearchParams()
  const memberId = searchParams.get('memberId')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (memberId && members.length > 0) {
      const member = members.find(m => m.id === memberId)
      if (member) {
        setSelectedMember(member)
      }
    }
  }, [memberId, members])

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members')
      setMembers(response.data)
    } catch (error) {
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (permissionType: string) => {
    if (!selectedMember) return

    const hasPermission = selectedMember.permissions.some(p => p.type === permissionType)

    try {
      if (hasPermission) {
        await api.delete(`/permissions/${selectedMember.id}/${permissionType}`)
        toast.success('Permissão removida com sucesso!')
      } else {
        await api.post(`/permissions/${selectedMember.id}`, { type: permissionType })
        toast.success('Permissão adicionada com sucesso!')
      }
      // Atualiza a lista de membros e o membro selecionado
      const response = await api.get('/members')
      const updatedMembers = response.data
      setMembers(updatedMembers)
      const updatedMember = updatedMembers.find((m: Member) => m.id === selectedMember.id)
      if (updatedMember) {
        setSelectedMember(updatedMember)
      }
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
                  onClick={() => setSelectedMember(member)}
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
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões de {selectedMember.name}
              </h2>
              <div className="space-y-3">
                {availablePermissions.map((permission) => {
                  const hasPermission = selectedMember.permissions.some(
                    p => p.type === permission.type
                  )
                  return (
                    <div
                      key={permission.type}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{permission.description}</p>
                        <p className="text-sm text-gray-600">{permission.type}</p>
                      </div>
                      <button
                        onClick={() => togglePermission(permission.type)}
                        className={`p-2 rounded-lg transition-colors ${
                          hasPermission
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {hasPermission ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )
                })}
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


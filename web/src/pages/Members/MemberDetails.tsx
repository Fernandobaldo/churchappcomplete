import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

interface Member {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  birthDate?: string
  role: string
  avatarUrl?: string
  permissions: Array<{ id: string; type: string }>
}

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchMember()
    }
  }, [id])

  const fetchMember = async () => {
    try {
      const response = await api.get(`/members/${id}`)
      setMember(response.data)
    } catch (error) {
      toast.error('Erro ao carregar membro')
      navigate('/members')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      MEMBER: 'Membro',
      COORDINATOR: 'Coordenador',
      ADMINFILIAL: 'Admin Filial',
      ADMINGERAL: 'Admin Geral',
    }
    return labels[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!member) {
    return null
  }

  const canManagePermissions = user?.permissions?.some(p => p.type === 'MANAGE_PERMISSIONS') || user?.role === 'ADMINGERAL'

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <div className="flex items-start gap-6 mb-6">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center">
              <span className="text-primary font-semibold text-3xl">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
            <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded text-sm font-medium">
              {getRoleLabel(member.role)}
            </span>
          </div>
          {canManagePermissions && (
            <button
              onClick={() => navigate(`/permissions?memberId=${member.id}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Gerenciar Permissões
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{member.email}</p>
              </div>
            </div>

            {member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{member.phone}</p>
                </div>
              </div>
            )}

            {member.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{member.address}</p>
                </div>
              </div>
            )}

            {member.birthDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Data de Nascimento</p>
                  <p className="font-medium">
                    {new Date(member.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {member.permissions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões
              </h3>
              <div className="space-y-2">
                {member.permissions.map((permission) => (
                  <span
                    key={permission.id}
                    className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm mr-2 mb-2"
                  >
                    {permission.type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


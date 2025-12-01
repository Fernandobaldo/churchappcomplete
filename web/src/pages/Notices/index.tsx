import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bell, CheckCircle } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'
import { useAuthStore } from '../../stores/authStore'

interface Notice {
  id: string
  title: string
  message: string
  branchId: string
  viewedBy: string[]
  read: boolean
  createdAt: string
  updatedAt: string
}

export default function Notices() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices')
      setNotices(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar avisos'
      toast.error(errorMessage)
      console.error('Erro ao carregar avisos:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notices/${id}/read`)
      // Atualiza o estado local
      setNotices(prevNotices =>
        prevNotices.map(notice =>
          notice.id === id ? { ...notice, read: true } : notice
        )
      )
      toast.success('Aviso marcado como lido')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao marcar aviso como lido')
    }
  }

  const unreadCount = notices.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avisos e Comunicados</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? (
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-500" />
                {unreadCount} {unreadCount === 1 ? 'aviso não lido' : 'avisos não lidos'}
              </span>
            ) : (
              'Todos os avisos foram lidos'
            )}
          </p>
        </div>
        <PermissionGuard permission="members_manage">
          <button
            onClick={() => navigate('/app/notices/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Aviso
          </button>
        </PermissionGuard>
      </div>

      {notices.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhum aviso cadastrado</p>
          <PermissionGuard permission="members_manage">
            <button
              onClick={() => navigate('/app/notices/new')}
              className="text-primary hover:underline"
            >
              Criar primeiro aviso
            </button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`card cursor-pointer hover:shadow-md transition-shadow ${
                !notice.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
              }`}
              onClick={() => !notice.read && markAsRead(notice.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3
                      className={`text-lg font-semibold ${
                        !notice.read ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {notice.title}
                    </h3>
                    {notice.read && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {!notice.read && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 whitespace-pre-wrap">{notice.message}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(notice.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!notice.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(notice.id)
                    }}
                    className="ml-4 px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                  >
                    Marcar como lido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




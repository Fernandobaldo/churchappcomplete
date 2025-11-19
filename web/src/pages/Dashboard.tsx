import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Heart, BookOpen, Church, Plus } from 'lucide-react'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

interface NextEvent {
  id: string
  title: string
  date: string
  location: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventResponse] = await Promise.all([
          api.get('/events/next').catch(() => ({ data: null })),
        ])
        setNextEvent(eventResponse.data)
      } catch (error) {
        toast.error('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const tiles = [
    {
      id: 'events',
      title: 'Eventos',
      icon: Calendar,
      path: '/app/events',
      color: 'bg-blue-500',
    },
    {
      id: 'contributions',
      title: 'Contribuições',
      icon: Heart,
      path: '/app/contributions',
      color: 'bg-red-500',
    },
    {
      id: 'devotionals',
      title: 'Devocionais',
      icon: BookOpen,
      path: '/app/devotionals',
      color: 'bg-green-500',
    },
    {
      id: 'members',
      title: 'Membros',
      icon: Church,
      path: '/app/members',
      color: 'bg-purple-500',
    },
  ]

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bem-vindo, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.id}
              onClick={() => navigate(tile.path)}
              className="card hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`${tile.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tile.title}</h3>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {nextEvent && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Próximo Evento</h2>
          <div className="flex items-center gap-4">
            <div className="bg-primary-light p-4 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{nextEvent.title}</h3>
              <p className="text-gray-600">
                {new Date(nextEvent.date).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-600">{nextEvent.location}</p>
            </div>
            <button
              onClick={() => navigate(`/app/events/${nextEvent.id}`)}
              className="btn-primary"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/app/events/new')}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-primary" />
              <span>Criar Novo Evento</span>
            </button>
            <button
              onClick={() => navigate('/app/contributions/new')}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-primary" />
              <span>Adicionar Contribuição</span>
            </button>
            <button
              onClick={() => navigate('/app/devotionals/new')}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-primary" />
              <span>Criar Devocional</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informações</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Perfil:</span>
              <span className="font-medium">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


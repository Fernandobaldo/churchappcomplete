import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  imageUrl?: string
  hasDonation: boolean
}

export default function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events')
      setEvents(response.data)
    } catch (error) {
      toast.error('Erro ao carregar eventos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando eventos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">Gerencie os eventos da igreja</p>
        </div>
        <PermissionGuard permission="events_manage">
          <button onClick={() => navigate('/app/events/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Evento
          </button>
        </PermissionGuard>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nenhum evento cadastrado</p>
          <PermissionGuard permission="events_manage">
            <button onClick={() => navigate('/app/events/new')} className="btn-primary">
              Criar Primeiro Evento
            </button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/events/${event.id}`)}
            >
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              {event.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {event.startDate && !isNaN(new Date(event.startDate).getTime())
                      ? format(new Date(event.startDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                      : 'Data inválida'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{event.location}</span>
                </div>
                {event.hasDonation && (
                  <span className="inline-block px-2 py-1 bg-primary-light text-primary text-xs rounded">
                    Aceita doações
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


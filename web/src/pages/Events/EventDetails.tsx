import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Edit, Trash2, ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'
import { useAuthStore } from '../../stores/authStore'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  imageUrl?: string
  hasDonation: boolean
  donationLink?: string
  donationReason?: string
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`)
      setEvent(response.data)
    } catch (error) {
      toast.error('Erro ao carregar evento')
      navigate('/app/events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      await api.delete(`/events/${id}`)
      toast.success('Evento excluído com sucesso!')
      navigate('/app/events')
    } catch (error) {
      toast.error('Erro ao excluir evento')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="space-y-6">
      <button
        id="back-button"
        onClick={() => navigate('/app/events')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      )}

      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h1 id="event-title" className="text-3xl font-bold">{event.title}</h1>
          <PermissionGuard permission="events_manage">
            <div className="flex gap-2">
              <button
                id="edit-button"
                onClick={() => navigate(`/app/events/${id}/edit`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                id="delete-button"
                onClick={handleDelete}
                className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </PermissionGuard>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>
              {format(new Date(event.startDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{event.location}</span>
          </div>

          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p id="event-description" className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.hasDonation && (
            <div id="donation-section" className="bg-primary-light p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Doações</h3>
              {event.donationReason && <p id="donation-reason" className="text-gray-700 mb-2">{event.donationReason}</p>}
              {event.donationLink && (
                <a
                  id="donation-link"
                  href={event.donationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {event.donationLink}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


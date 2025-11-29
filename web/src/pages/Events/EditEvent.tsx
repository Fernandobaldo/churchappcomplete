import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface EventForm {
  title: string
  description: string
  date: string
  location: string
  hasDonation: boolean
  donationLink?: string
  donationReason?: string
  imageUrl?: string
}

export default function EditEvent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventForm>()

  const hasDonation = watch('hasDonation')

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`)
      const event = response.data
      setValue('title', event.title)
      setValue('description', event.description || '')
      
      // Combina startDate com time para preencher o campo datetime-local corretamente
      let dateTimeValue = ''
      if (event.startDate) {
        const startDate = new Date(event.startDate)
        
        // Se houver campo time separado, usa ele para definir a hora
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number)
          startDate.setHours(hours || 0, minutes || 0, 0, 0)
        }
        
        // Formata para datetime-local (YYYY-MM-DDTHH:mm)
        const year = startDate.getFullYear()
        const month = String(startDate.getMonth() + 1).padStart(2, '0')
        const day = String(startDate.getDate()).padStart(2, '0')
        const hours = String(startDate.getHours()).padStart(2, '0')
        const mins = String(startDate.getMinutes()).padStart(2, '0')
        dateTimeValue = `${year}-${month}-${day}T${hours}:${mins}`
      } else if (event.date) {
        // Fallback para compatibilidade
        dateTimeValue = new Date(event.date).toISOString().slice(0, 16)
      }
      
      setValue('date', dateTimeValue)
      setValue('location', event.location)
      setValue('hasDonation', event.hasDonation || false)
      setValue('donationLink', event.donationLink || '')
      setValue('donationReason', event.donationReason || '')
      setValue('imageUrl', event.imageUrl || '')
    } catch (error) {
      toast.error('Erro ao carregar evento')
      navigate('/app/events')
    }
  }

  const onSubmit = async (data: EventForm) => {
    try {
      // Converte date (datetime-local) para startDate e endDate (ISO)
      const dateValue = data.date ? new Date(data.date).toISOString() : ''
      
      await api.put(`/events/${id}`, {
        ...data,
        startDate: dateValue,
        endDate: dateValue, // Por padrão, usa a mesma data para início e fim
        date: undefined, // Remove o campo date
      })
      toast.success('Evento atualizado com sucesso!')
      navigate(`/app/events/${id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar evento')
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/app/events/${id}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Editar Evento</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              {...register('description')}
              className="input"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                {...register('date', { required: 'Data é obrigatória' })}
                className="input"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local *
              </label>
              <input
                {...register('location', { required: 'Local é obrigatório' })}
                className="input"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              {...register('imageUrl')}
              type="url"
              className="input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDonation"
              {...register('hasDonation')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="hasDonation" className="text-sm font-medium text-gray-700">
              Aceita doações
            </label>
          </div>

          {hasDonation && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Doação
                </label>
                <input
                  {...register('donationReason')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link para Doação
                </label>
                <input
                  {...register('donationLink')}
                  type="url"
                  className="input"
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/app/events/${id}`)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


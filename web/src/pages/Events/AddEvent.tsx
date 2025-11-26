import { useNavigate } from 'react-router-dom'
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

export default function AddEvent() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventForm>({
    defaultValues: {
      hasDonation: false,
    },
  })

  const hasDonation = watch('hasDonation')

  const onSubmit = async (data: EventForm) => {
    try {
      // Converte date (datetime-local) para startDate e endDate (ISO)
      const dateValue = data.date ? new Date(data.date).toISOString() : ''
      
      await api.post('/events', {
        ...data,
        startDate: dateValue,
        endDate: dateValue, // Por padrão, usa a mesma data para início e fim
        date: undefined, // Remove o campo date
      })
      toast.success('Evento criado com sucesso!')
      navigate('/app/events')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar evento')
    }
  }

  return (
    <div className="space-y-6">
      <button
        data-testid="back-button"
        onClick={() => navigate('/app/events')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Novo Evento</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              id="title"
              data-testid="title-input"
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: Culto de Domingo"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              data-testid="description-input"
              {...register('description')}
              className="input"
              rows={4}
              placeholder="Descrição do evento..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data e Hora *
              </label>
              <input
                id="date"
                data-testid="date-input"
                type="datetime-local"
                {...register('date', { required: 'Data é obrigatória' })}
                className="input"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Local *
              </label>
              <input
                id="location"
                data-testid="location-input"
                {...register('location', { required: 'Local é obrigatório' })}
                className="input"
                placeholder="Ex: Templo Principal"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              id="imageUrl"
              {...register('imageUrl')}
              type="url"
              className="input"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDonation"
              data-testid="has-donation-checkbox"
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
                <label htmlFor="donationReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Doação
                </label>
                <input
                  id="donationReason"
                  {...register('donationReason')}
                  className="input"
                  placeholder="Ex: Construção do novo templo"
                />
              </div>

              <div>
                <label htmlFor="donationLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Link para Doação
                </label>
                <input
                  id="donationLink"
                  {...register('donationLink')}
                  type="url"
                  className="input"
                  placeholder="https://exemplo.com/doacao"
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <button
              data-testid="cancel-button"
              type="button"
              onClick={() => navigate('/app/events')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button data-testid="submit-button" type="submit" className="btn-primary flex-1">
              Criar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


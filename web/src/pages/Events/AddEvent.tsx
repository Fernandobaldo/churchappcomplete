import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Upload, X } from 'lucide-react'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const hasDonation = watch('hasDonation')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    if (imageFile) {
      setImageFile(null)
      setImagePreview(null)
    } else {
      setCurrentImageUrl(null)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await api.post('/upload/event-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error)
      toast.error(error.response?.data?.error || 'Erro ao fazer upload da imagem')
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data: EventForm) => {
    try {
      let imageUrl: string | undefined = undefined

      // Se há um novo arquivo de imagem, faz upload primeiro
      if (imageFile) {
        imageUrl = await uploadImage()
        if (!imageUrl) {
          toast.error('Erro ao fazer upload da imagem')
          return
        }
      } else if (currentImageUrl) {
        // Se não há novo arquivo mas há uma imagem existente, usa ela
        imageUrl = currentImageUrl
      }

      // Converte date (datetime-local) para startDate e endDate (ISO)
      const dateValue = data.date ? new Date(data.date).toISOString() : ''
      
      // Remove imageUrl e date do data para não enviar valores do formulário
      const { imageUrl: _, date: __, ...eventData } = data
      
      // Prepara o payload base
      const payload: any = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        time: eventData.time,
        hasDonation: eventData.hasDonation ?? false,
        donationReason: eventData.donationReason,
        donationLink: eventData.donationLink,
        startDate: dateValue,
        endDate: dateValue,
      }
      
      // Só inclui imageUrl se houver uma URL válida
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        payload.imageUrl = imageUrl
      }
      
      await api.post('/events', payload)
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
            <label htmlFor="event-image" className="block text-sm font-medium text-gray-700 mb-1">
              Imagem do Evento
            </label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {imageFile ? 'Alterar Imagem' : 'Selecionar Imagem'}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imageFile && (
                  <span className="text-sm text-gray-600">{imageFile.name}</span>
                )}
              </div>
              
              {(imagePreview || currentImageUrl) && (
                <div className="relative w-full max-w-md">
                  <img
                    src={imagePreview || (currentImageUrl?.startsWith('http') ? currentImageUrl : `${api.defaults.baseURL}${currentImageUrl}`)}
                    alt="Preview da imagem"
                    className="w-full h-auto rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
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
            <button 
              data-testid="submit-button" 
              type="submit" 
              className="btn-primary flex-1"
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Enviando...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


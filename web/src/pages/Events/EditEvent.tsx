import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

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
      if (event.imageUrl) {
        setCurrentImageUrl(event.imageUrl)
      }
    } catch (error) {
      toast.error('Erro ao carregar evento')
      navigate('/app/events', { replace: true })
    }
  }

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

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return

    try {
      await api.delete(`/events/${id}`)
      toast.success('Evento excluído com sucesso!')
      navigate('/app/events', { replace: true })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir evento')
    }
  }

  const onSubmit = async (data: EventForm) => {
    try {
      let imageUrl: string | null | undefined = undefined

      // Se há um novo arquivo de imagem, faz upload primeiro
      if (imageFile) {
        imageUrl = await uploadImage()
        if (!imageUrl) {
          toast.error('Erro ao fazer upload da imagem')
          return
        }
      } else if (!currentImageUrl) {
        // Se não há imagem nova nem existente, remove a imagem (null)
        imageUrl = null
      }
      // Se há currentImageUrl mas não há novo arquivo, não altera (undefined = não envia)

      // Converte date (datetime-local) para startDate e endDate (ISO)
      const dateValue = data.date ? new Date(data.date).toISOString() : ''
      
      // Remove imageUrl do data para não enviar valor do formulário
      const { imageUrl: _, ...eventData } = data
      
      // Prepara o payload
      const payload: any = {
        ...eventData,
        startDate: dateValue,
        endDate: dateValue,
      }
      
      // Só inclui imageUrl se houver alteração (nova imagem ou remoção)
      if (imageUrl !== undefined) {
        payload.imageUrl = imageUrl
      }
      
      await api.put(`/events/${id}`, payload)
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
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Enviando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleDelete}
            className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 w-full"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Evento
          </button>
        </div>
      </div>
    </div>
  )
}


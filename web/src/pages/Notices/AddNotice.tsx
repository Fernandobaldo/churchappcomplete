import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface NoticeForm {
  title: string
  message: string
}

export default function AddNotice() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<NoticeForm>({
    defaultValues: {
      title: '',
      message: '',
    },
  })

  const onSubmit = async (data: NoticeForm) => {
    try {
      await api.post('/notices', data)
      toast.success('Aviso criado com sucesso!')
      navigate('/app/notices')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar aviso'
      toast.error(errorMessage)
      console.error('Erro ao criar aviso:', error)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/app/notices')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Novo Aviso</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: Reunião de Oração"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem *
            </label>
            <textarea
              {...register('message', { required: 'Mensagem é obrigatória' })}
              className="input"
              rows={6}
              placeholder="Digite a mensagem do aviso..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary">
              Criar Aviso
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/notices')}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


















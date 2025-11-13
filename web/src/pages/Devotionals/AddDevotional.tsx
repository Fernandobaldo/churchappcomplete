import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface DevotionalForm {
  title: string
  content: string
  passage: string
}

export default function AddDevotional() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<DevotionalForm>()

  const onSubmit = async (data: DevotionalForm) => {
    try {
      await api.post('/devotionals', data)
      toast.success('Devocional criado com sucesso!')
      navigate('/devotionals')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar devocional')
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/devotionals')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Novo Devocional</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: A importância da oração"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passagem Bíblica *
            </label>
            <input
              {...register('passage', { required: 'Passagem bíblica é obrigatória' })}
              className="input"
              placeholder="Ex: João 3:16"
            />
            {errors.passage && (
              <p className="mt-1 text-sm text-red-600">{errors.passage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo *
            </label>
            <textarea
              {...register('content', { required: 'Conteúdo é obrigatório' })}
              className="input"
              rows={12}
              placeholder="Escreva o conteúdo do devocional..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/devotionals')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Criar Devocional
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


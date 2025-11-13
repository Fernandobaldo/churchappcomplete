import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface ContributionForm {
  title: string
  description: string
  value: number
  date: string
  type: 'OFERTA' | 'DIZIMO' | 'OUTRO'
}

export default function AddContribution() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<ContributionForm>({
    defaultValues: {
      type: 'OFERTA',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: ContributionForm) => {
    try {
      await api.post('/contributions', {
        ...data,
        value: parseFloat(data.value.toString()),
      })
      toast.success('Contribuição adicionada com sucesso!')
      navigate('/contributions')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar contribuição')
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/contributions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Nova Contribuição</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: Oferta de Domingo"
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
              rows={3}
              placeholder="Descrição da contribuição..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('value', { required: 'Valor é obrigatório', min: 0 })}
                className="input"
                placeholder="0.00"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                {...register('date', { required: 'Data é obrigatória' })}
                className="input"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              {...register('type', { required: 'Tipo é obrigatório' })}
              className="input"
            >
              <option value="OFERTA">Oferta</option>
              <option value="DIZIMO">Dízimo</option>
              <option value="OUTRO">Outro</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/contributions')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Adicionar Contribuição
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface TransactionForm {
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category: string
}

export default function AddTransaction() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<TransactionForm>({
    defaultValues: {
      type: 'ENTRY',
      category: '',
    },
  })

  const onSubmit = async (data: TransactionForm) => {
    try {
      await api.post('/finances', {
        ...data,
        amount: parseFloat(data.amount.toString()),
      })
      toast.success('Transação adicionada com sucesso!')
      navigate('/app/finances')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao adicionar transação'
      toast.error(errorMessage)
      console.error('Erro ao adicionar transação:', error)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/app/finances')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Nova Transação</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: Pagamento de aluguel"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                })}
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                {...register('type', { required: 'Tipo é obrigatório' })}
                className="input"
              >
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Saída</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <input
              {...register('category')}
              className="input"
              placeholder="Ex: Aluguel, Salário, Material, etc."
            />
            <p className="mt-1 text-xs text-gray-500">Opcional - Categoria da transação</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary">
              Salvar Transação
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/finances')}
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




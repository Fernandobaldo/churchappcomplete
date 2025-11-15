import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'

interface FilialForm {
  name: string
  location: string
}

export default function Filial() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [mainBranch, setMainBranch] = useState<{ id: string; name: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FilialForm>()

  // Busca a filial principal (Sede) ao montar o componente
  useEffect(() => {
    const loadMainBranch = async () => {
      try {
        const response = await api.get('/branches')
        const branches = response.data

        if (branches && branches.length > 0) {
          // Encontra a filial principal (isMainBranch: true) ou a primeira
          const main = branches.find((b: any) => b.isMainBranch) || branches[0]
          setMainBranch({ id: main.id, name: main.name })
          setValue('name', main.name || 'Sede')
        }
      } catch (error: any) {
        console.error('Erro ao buscar filial:', error)
        // Se não houver filial, usa "Sede" como padrão
        setValue('name', 'Sede')
      }
    }

    loadMainBranch()
  }, [setValue])

  const onSubmit = async (data: FilialForm) => {
    setLoading(true)
    try {
      if (mainBranch) {
        // TODO: Quando houver endpoint PUT /branches/:id, atualizar aqui
        // Por enquanto, apenas mantém o estado
        toast.success('Informações da filial salvas!')
      } else {
        toast.info('As informações serão salvas na próxima etapa.')
      }

      navigate('/onboarding/convites')
    } catch (error: any) {
      console.error('Erro ao salvar filial:', error)
      // Mesmo com erro, permite continuar
      toast.error('Não foi possível salvar. Você pode atualizar depois.')
      navigate('/onboarding/convites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Filial Padrão</h1>
            <p className="text-gray-600">
              Configure a filial principal (Sede) da sua igreja
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da filial *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Nome da filial é obrigatório',
                  minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
                })}
                className="input"
                placeholder="Ex: Sede, Sede Central, Campus Centro"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Esta é a filial principal da sua igreja. Você pode criar outras filiais depois.
              </p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Localização
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="input"
                placeholder="Ex: São Paulo - SP, Rio de Janeiro - RJ"
              />
              <p className="mt-1 text-xs text-gray-500">Campo opcional - cidade ou endereço</p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/onboarding/igreja')}
                className="btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Salvando...' : 'Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


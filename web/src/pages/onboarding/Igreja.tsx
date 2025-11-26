import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'

interface IgrejaForm {
  name: string
  denomination: string
  language: string
  timezone: string
}

export default function Igreja() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [churchId, setChurchId] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IgrejaForm>({
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    },
  })

  // Busca os dados da igreja ao montar o componente
  useEffect(() => {
    const loadChurchData = async () => {
      try {
        // Busca as igrejas do usuário
        const response = await api.get('/churches')
        const churches = response.data
        
        if (churches && Array.isArray(churches) && churches.length > 0) {
          const church = churches[0]
          setChurchId(church.id)
          setValue('name', church.name || '')
        }
      } catch (error: any) {
        // Se não houver igreja ainda, pode continuar normalmente
        // Isso é esperado se o registro ainda não criou a igreja
        console.log('Igreja ainda não encontrada. Será criada/atualizada neste passo.')
      }
    }

    loadChurchData()
  }, [setValue])

  const onSubmit = async (data: IgrejaForm) => {
    setLoading(true)
    try {
      if (churchId) {
        // Atualiza a igreja existente
        await api.put(`/churches/${churchId}`, {
          name: data.name,
          logoUrl: undefined, // Pode ser adicionado depois
        })
        toast.success('Configurações da igreja atualizadas!')
      } else {
        // Cria uma nova igreja (caso não tenha sido criada no registro)
        try {
          const response = await api.post('/churches', {
            name: data.name,
            withBranch: true,
            branchName: 'Sede',
          })
          setChurchId(response.data.church?.id || response.data.id)
          toast.success('Igreja criada com sucesso!')
        } catch (error: any) {
          console.error('Erro ao criar igreja:', error)
          toast.error('Não foi possível criar a igreja agora. Você pode criar depois.')
        }
      }

      navigate('/onboarding/filial')
    } catch (error: any) {
      console.error('Erro ao salvar configurações da igreja:', error)
      // Mesmo com erro, permite continuar para não bloquear o fluxo
      toast.error('Não foi possível salvar as configurações. Você pode atualizar depois.')
      navigate('/onboarding/filial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader />
      <div className="flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações da Igreja</h1>
            <p className="text-gray-600">
              Configure as informações básicas da sua igreja
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da igreja *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Nome da igreja é obrigatório',
                  minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
                })}
                className="input"
                placeholder="Nome da sua igreja"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="denomination" className="block text-sm font-medium text-gray-700 mb-1">
                Denominação
              </label>
              <input
                id="denomination"
                type="text"
                {...register('denomination')}
                className="input"
                placeholder="Ex: Batista, Assembleia de Deus, etc."
              />
              <p className="mt-1 text-xs text-gray-500">Campo opcional</p>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Idioma padrão
              </label>
              <select
                id="language"
                {...register('language', { required: true })}
                className="input"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="pt-PT">Português (Portugal)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Fuso horário
              </label>
              <select
                id="timezone"
                {...register('timezone', { required: true })}
                className="input"
              >
                <option value="America/Sao_Paulo">America/São_Paulo (Brasília)</option>
                <option value="America/Manaus">America/Manaus</option>
                <option value="America/Rio_Branco">America/Rio_Branco</option>
                <option value="America/Fortaleza">America/Fortaleza</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/onboarding/bem-vindo')}
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
    </div>
  )
}


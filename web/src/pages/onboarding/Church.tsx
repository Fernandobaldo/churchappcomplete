import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'
import OnboardingHeader from '../../components/OnboardingHeader'

interface ChurchForm {
  name: string
  country: string
  city: string
  language: string
  primaryColor: string
  logoUrl: string
  address: string
  phone?: string
  email?: string
  website?: string
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
}

export default function Church() {
  const navigate = useNavigate()
  const { user, setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [churchId, setChurchId] = useState<string | null>(null)
  const structureType = localStorage.getItem('onboarding_structure') || 'simple'
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ChurchForm>({
    defaultValues: {
      language: 'pt-BR',
      primaryColor: '#3B82F6', // Azul padrão
      country: 'BR',
    },
  })

  // Busca os dados da igreja ao montar o componente
  useEffect(() => {
    const loadChurchData = async () => {
      try {
        const response = await api.get('/churches').catch(() => ({ data: [] }))
        const churches = response.data
        
        if (churches && Array.isArray(churches) && churches.length > 0) {
          // Se o usuário tem branchId, usa a igreja da branch do usuário
          // Caso contrário, usa a primeira igreja (compatibilidade com onboarding)
          let church = churches[0]
          
          if (user?.branchId) {
            // Procura a igreja que contém a branch do usuário
            const userChurch = churches.find((c: any) => 
              c.Branch && Array.isArray(c.Branch) && 
              c.Branch.some((b: any) => b.id === user.branchId)
            )
            if (userChurch) {
              church = userChurch
            }
          }
          
          setChurchId(church.id)
          setValue('name', church.name || '')
          setValue('logoUrl', church.logoUrl || '')
        }
      } catch (error: any) {
        // Se não houver igreja ainda, pode continuar normalmente
        // Isso é esperado se o registro ainda não criou a igreja
        console.log('Igreja ainda não encontrada. Será criada neste passo.')
      }
    }

    loadChurchData()
  }, [setValue, user?.branchId])

  const onSubmit = async (data: ChurchForm) => {
    setLoading(true)
    try {
      const socialMedia = {
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        youtube: data.youtube || undefined,
        twitter: data.twitter || undefined,
      }

      // Remove campos undefined
      Object.keys(socialMedia).forEach(key => {
        if (socialMedia[key as keyof typeof socialMedia] === undefined) {
          delete socialMedia[key as keyof typeof socialMedia]
        }
      })

      if (churchId) {
        // Atualiza a igreja existente
        await api.put(`/churches/${churchId}`, {
          name: data.name,
          logoUrl: data.logoUrl || undefined,
          address: data.address || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
        })
        toast.success('Configurações da igreja atualizadas!')
        
        // Marcar etapa church como completa (mesmo ao atualizar)
        try {
          await api.post('/onboarding/progress/church')
        } catch (progressError) {
          console.error('Erro ao marcar progresso:', progressError)
        }
      } else {
        // Cria uma nova igreja
        const response = await api.post('/churches', {
          name: data.name,
          logoUrl: data.logoUrl || undefined,
          address: data.address || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
          withBranch: true,
          branchName: 'Sede',
        })
        setChurchId(response.data.church?.id || response.data.id)
        
        // Atualiza o token se um novo token foi retornado
        if (response.data.token) {
          console.log('🔑 Token recebido após criar igreja:', response.data.token.substring(0, 50) + '...')
          setUserFromToken(response.data.token)
          
          // Verifica se o branchId foi incluído no token
          const decoded = jwtDecode<{ branchId?: string | null; role?: string; name?: string }>(response.data.token)
          console.log('🔍 Token decodificado:', { branchId: decoded.branchId, role: decoded.role, name: decoded.name })
          
          if (!decoded.branchId) {
            console.warn('⚠️ ATENÇÃO: branchId não está presente no token após criar igreja!')
          }
        } else {
          console.warn('⚠️ Token não foi retornado após criar igreja')
        }
        
        toast.success('Igreja criada com sucesso!')
      }

      // Marcar etapa church como completa
      try {
        await api.post('/onboarding/progress/church')
      } catch (progressError) {
        console.error('Erro ao marcar progresso:', progressError)
      }

      // Salva dados adicionais no localStorage para uso posterior
      localStorage.setItem('onboarding_church_data', JSON.stringify({
        country: data.country,
        city: data.city,
        language: data.language,
        primaryColor: data.primaryColor,
        address: data.address,
      }))

      // Se escolheu estrutura com filiais, vai para criação de filiais
      // Caso contrário, vai direto para configurações
      if (structureType === 'branches') {
        navigate('/onboarding/branches')
      } else {
        navigate('/onboarding/settings')
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações da igreja:', error)
      toast.error('Não foi possível salvar as configurações. Tente novamente.')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Igreja Principal</h1>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  País *
                </label>
                <select
                  id="country"
                  {...register('country', { required: 'País é obrigatório' })}
                  className="input"
                >
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="PT">Portugal</option>
                  <option value="ES">Espanha</option>
                  <option value="MX">México</option>
                </select>
                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city', { required: 'Cidade é obrigatória' })}
                  className="input"
                  placeholder="São Paulo"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                id="address"
                type="text"
                {...register('address')}
                className="input"
                placeholder="Rua, número, bairro"
              />
              <p className="mt-1 text-xs text-gray-500">Campo opcional</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma padrão *
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
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor principal *
                </label>
                <div className="flex gap-2">
                  <input
                    id="primaryColor"
                    type="color"
                    {...register('primaryColor', { required: true })}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    {...register('primaryColor', { required: true })}
                    className="input flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Logo (URL)
              </label>
              <input
                id="logoUrl"
                type="url"
                {...register('logoUrl')}
                className="input"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="mt-1 text-xs text-gray-500">Campo opcional - Cole a URL da imagem do logo</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="input"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="input"
                  placeholder="contato@igreja.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                id="website"
                type="url"
                {...register('website')}
                className="input"
                placeholder="https://www.igreja.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redes Sociais
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facebook" className="block text-xs text-gray-600 mb-1">
                    Facebook
                  </label>
                  <input
                    id="facebook"
                    type="url"
                    {...register('facebook')}
                    className="input"
                    placeholder="https://facebook.com/igreja"
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="block text-xs text-gray-600 mb-1">
                    Instagram
                  </label>
                  <input
                    id="instagram"
                    type="url"
                    {...register('instagram')}
                    className="input"
                    placeholder="https://instagram.com/igreja"
                  />
                </div>
                <div>
                  <label htmlFor="youtube" className="block text-xs text-gray-600 mb-1">
                    YouTube
                  </label>
                  <input
                    id="youtube"
                    type="url"
                    {...register('youtube')}
                    className="input"
                    placeholder="https://youtube.com/igreja"
                  />
                </div>
                <div>
                  <label htmlFor="twitter" className="block text-xs text-gray-600 mb-1">
                    Twitter
                  </label>
                  <input
                    id="twitter"
                    type="url"
                    {...register('twitter')}
                    className="input"
                    placeholder="https://twitter.com/igreja"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/onboarding/start')}
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


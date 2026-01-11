import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { Upload, X } from 'lucide-react'

interface Country {
  code: string
  name: string
  dialCode: string
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', dialCode: '+55' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'ES', name: 'Espanha', dialCode: '+34' },
  { code: 'MX', name: 'México', dialCode: '+52' },
  { code: 'CO', name: 'Colômbia', dialCode: '+57' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'UY', name: 'Uruguai', dialCode: '+598' },
  { code: 'PY', name: 'Paraguai', dialCode: '+595' },
  { code: 'BO', name: 'Bolívia', dialCode: '+591' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58' },
  { code: 'EC', name: 'Equador', dialCode: '+593' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
  { code: 'PA', name: 'Panamá', dialCode: '+507' },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1' },
  { code: 'CU', name: 'Cuba', dialCode: '+53' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502' },
  { code: 'HN', name: 'Honduras', dialCode: '+504' },
]

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  document: string
}

export default function Register() {
  const { setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'BR') || countries[0]
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      let avatarUrl: string | undefined = undefined

      // Upload do avatar se houver (após criar conta e ter token)
      // Por enquanto, vamos fazer upload depois de criar a conta
      // pois o endpoint de upload requer autenticação

      let response
      
      // Tenta primeiro o endpoint /register (registro público)
      try {
        response = await api.post('/register', {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone ? `${selectedCountry.dialCode} ${data.phone}` : undefined,
          document: data.document,
          avatarUrl,
        })
        
        const { token } = response.data
        
        if (!token) {
          throw new Error('Token não recebido do servidor')
        }
        
        // Salva o token
        setUserFromToken(token)
        
        // Upload do avatar se houver (após ter token)
        if (avatarFile) {
          try {
            const formData = new FormData()
            formData.append('file', avatarFile)
            const uploadResponse = await api.post('/upload/avatar', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            avatarUrl = uploadResponse.data.url
            
            // Atualiza o perfil com o avatar (se Member existir)
            try {
              const profileResponse = await api.get('/members/me')
              const memberId = profileResponse.data.id
              await api.put(`/members/${memberId}`, { avatarUrl })
            } catch (error) {
              // Member ainda não existe (normal após registro público)
              // O avatar será atualizado após completar onboarding
              console.log('Member ainda não existe, avatar será atualizado após onboarding')
            }
          } catch (uploadError: any) {
            console.error('Erro ao fazer upload do avatar:', uploadError)
            // Não bloqueia o fluxo se o upload falhar
          }
        }
        
        toast.success('Conta criada com sucesso!')
        
        // O PublicRoute/OnboardingRoute vai redirecionar automaticamente para /onboarding/start
        // quando detectar que não tem Member completo
        return
      } catch (firstError: any) {
        // Se falhar, tenta o endpoint /public/register
        if (firstError.response?.status === 400 || firstError.response?.status === 404 || firstError.response?.status === 401) {
          console.log('Endpoint /register não disponível, usando alternativa...')
          
          // Registra o usuário primeiro
          const registerResponse = await api.post('/public/register', {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            phone: data.phone ? `${selectedCountry.dialCode} ${data.phone}` : undefined,
            document: data.document,
          })
          
          const { token } = registerResponse.data
          
          if (!token) {
            throw new Error('Token não recebido do servidor')
          }
          
          // Salva o token
          setUserFromToken(token)
          
          // Upload do avatar se houver (após ter token)
          if (avatarFile) {
            try {
              const formData = new FormData()
              formData.append('file', avatarFile)
              const uploadResponse = await api.post('/upload/avatar', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })
              avatarUrl = uploadResponse.data.url
              
              // Atualiza o perfil com o avatar (se Member existir)
              try {
                const profileResponse = await api.get('/members/me')
                const memberId = profileResponse.data.id
                await api.put(`/members/${memberId}`, { avatarUrl })
              } catch (error) {
                // Member ainda não existe (normal após registro público)
                // O avatar será atualizado após completar onboarding
                console.log('Member ainda não existe, avatar será atualizado após onboarding')
              }
            } catch (uploadError: any) {
              console.error('Erro ao fazer upload do avatar:', uploadError)
              // Não bloqueia o fluxo se o upload falhar
            }
          }
          
          toast.success('Conta criada com sucesso!')
          
          // O PublicRoute/OnboardingRoute vai redirecionar automaticamente para /onboarding/start
          // quando detectar que não tem Member completo
          return
        }
        throw firstError
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      
      if (error.response?.status === 409 || error.response?.data?.message?.includes('já está em uso')) {
        toast.error('Este email já está cadastrado. Tente fazer login ou use outro email.')
      } else {
        toast.error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Não foi possível criar a conta. Verifique os dados e tente novamente.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary">ChurchPulse</h1>
          <p className="text-center text-gray-600 mb-8">Crie sua conta para começar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Primeiro nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'Primeiro nome é obrigatório',
                    minLength: { value: 2, message: 'Primeiro nome deve ter pelo menos 2 caracteres' },
                  })}
                  className="input"
                  placeholder="João"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Sobrenome é obrigatório',
                    minLength: { value: 2, message: 'Sobrenome deve ter pelo menos 2 caracteres' },
                  })}
                  className="input"
                  placeholder="Silva"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                className="input"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: { value: 6, message: 'Senha deve ter no mínimo 6 caracteres' },
                })}
                className="input"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <div className="flex gap-2">
                <select
                  id="countryCode"
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const country = countries.find(c => c.code === e.target.value)
                    if (country) setSelectedCountry(country)
                  }}
                  className="input w-32"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.dialCode} {country.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', {
                    required: 'Telefone é obrigatório',
                  })}
                  className="input flex-1"
                  placeholder="Número do telefone"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                CPF/CNPJ
              </label>
              <input
                id="document"
                type="text"
                {...register('document', {
                  required: 'CPF/CNPJ é obrigatório',
                  minLength: { value: 11, message: 'CPF/CNPJ deve ter no mínimo 11 dígitos' },
                  pattern: {
                    value: /^[\d\.\-\/]+$/,
                    message: 'CPF/CNPJ inválido',
                  },
                })}
                className="input"
                placeholder="000.000.000-00"
              />
              {errors.document && <p className="mt-1 text-sm text-red-600">{errors.document.message}</p>}
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                Foto de perfil (opcional)
              </label>
              {avatarPreview ? (
                <div className="relative inline-block">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="avatar"
                  className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Adicionar</span>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="mt-1 text-xs text-gray-500">Máximo 5MB</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Criando conta...' : 'Criar conta e continuar'}
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Já tem uma conta?{' '}
              <a href="/login" className="text-primary hover:underline">
                Fazer login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}


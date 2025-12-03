import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { Upload, X } from 'lucide-react'

interface RegisterForm {
  name: string
  email: string
  password: string
  churchName: string
}

export default function Register() {
  const navigate = useNavigate()
  const { setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
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
          name: data.name,
          email: data.email,
          password: data.password,
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
            
            // Atualiza o perfil com o avatar
            try {
              const profileResponse = await api.get('/members/me')
              const memberId = profileResponse.data.id
              await api.put(`/members/${memberId}`, { avatarUrl })
            } catch (error) {
              console.error('Erro ao atualizar avatar:', error)
            }
          } catch (uploadError: any) {
            console.error('Erro ao fazer upload do avatar:', uploadError)
            // Não bloqueia o fluxo se o upload falhar
          }
        }
        
        // Tenta criar a igreja com filial
        try {
          await api.post('/churches', {
            name: data.churchName,
            withBranch: true,
            branchName: 'Sede',
          })
          toast.success('Conta e igreja criadas com sucesso!')
        } catch (churchError: any) {
          // Se não conseguir criar a igreja, continua mesmo assim
          console.warn('Não foi possível criar a igreja automaticamente:', churchError)
          toast.success('Conta criada! Complete a configuração da igreja no próximo passo.')
        }
        
        navigate('/onboarding/start')
        return
      } catch (firstError: any) {
        // Se falhar, tenta o endpoint /public/register e depois cria a igreja
        if (firstError.response?.status === 400 || firstError.response?.status === 404 || firstError.response?.status === 401) {
          console.log('Endpoint /register não disponível, usando alternativa...')
          
          // Registra o usuário primeiro
          const registerResponse = await api.post('/public/register', {
            name: data.name,
            email: data.email,
            password: data.password,
          })
          
          const { token } = registerResponse.data
          
          if (!token) {
            throw new Error('Token não recebido do servidor')
          }
          
          // Salva o token temporariamente
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
              
              // Atualiza o perfil com o avatar
              try {
                const profileResponse = await api.get('/members/me')
                const memberId = profileResponse.data.id
                await api.put(`/members/${memberId}`, { avatarUrl })
              } catch (error) {
                console.error('Erro ao atualizar avatar:', error)
              }
            } catch (uploadError: any) {
              console.error('Erro ao fazer upload do avatar:', uploadError)
              // Não bloqueia o fluxo se o upload falhar
            }
          }
          
          // Tenta criar a igreja com filial
          try {
            await api.post('/churches', {
              name: data.churchName,
              withBranch: true,
              branchName: 'Sede',
            })
            toast.success('Conta e igreja criadas com sucesso!')
          } catch (churchError: any) {
            // Se não conseguir criar a igreja, continua mesmo assim
            console.warn('Não foi possível criar a igreja automaticamente:', churchError)
            toast.success('Conta criada! Complete a configuração da igreja no próximo passo.')
          }
          
          navigate('/onboarding/start')
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
                })}
                className="input"
                placeholder="Seu nome completo"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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

            <div>
              <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da igreja
              </label>
              <input
                id="churchName"
                type="text"
                {...register('churchName', {
                  required: 'Nome da igreja é obrigatório',
                  minLength: { value: 2, message: 'Nome da igreja deve ter pelo menos 2 caracteres' },
                })}
                className="input"
                placeholder="Igreja Exemplo"
              />
              {errors.churchName && (
                <p className="mt-1 text-sm text-red-600">{errors.churchName.message}</p>
              )}
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


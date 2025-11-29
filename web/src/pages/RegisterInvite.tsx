import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'

interface RegisterInviteForm {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  birthDate?: string
  avatarUrl?: string
}

interface InviteLinkInfo {
  id: string
  branchName: string
  churchName: string
  expiresAt: string | null
  maxUses: number | null
  currentUses: number
  isActive: boolean
}

export default function RegisterInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [linkInfo, setLinkInfo] = useState<InviteLinkInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInviteForm>()

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError('Token de convite não fornecido')
      setValidating(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await api.get(`/invite-links/${token}/info`)
      setLinkInfo(response.data)
      
      // Verificar se está ativo
      if (!response.data.isActive) {
        setError('Este link de convite foi desativado')
        setValidating(false)
        return
      }

      // Verificar se expirou
      if (response.data.expiresAt && new Date(response.data.expiresAt) < new Date()) {
        setError('Este link de convite expirou')
        setValidating(false)
        return
      }

      // Verificar se atingiu o limite
      if (response.data.maxUses !== null && response.data.currentUses >= response.data.maxUses) {
        setError('Este link de convite atingiu o limite de usos')
        setValidating(false)
        return
      }

      setValidating(false)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Link de convite não encontrado')
      } else {
        setError('Erro ao validar link de convite')
      }
      setValidating(false)
    }
  }

  const onSubmit = async (data: RegisterInviteForm) => {
    if (!token) {
      toast.error('Token de convite não fornecido')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/public/register/invite', {
        ...data,
        inviteToken: token,
      })

      const { token: authToken, member } = response.data

      if (!authToken) {
        throw new Error('Token não recebido do servidor')
      }

      // Salva o token
      setUserFromToken(authToken)
      toast.success('Registro realizado com sucesso! Bem-vindo(a)!')
      
      // Redireciona para o dashboard
      navigate('/app/dashboard')
    } catch (error: any) {
      console.error('Erro ao registrar:', error)
      
      if (error.response?.data?.error === 'LIMIT_REACHED') {
        // Redireciona para página de limite atingido
        navigate(`/member-limit-reached?token=${token}`)
        return
      }

      if (error.response?.status === 403 && error.response?.data?.error === 'LIMIT_REACHED') {
        navigate(`/member-limit-reached?token=${token}`)
        return
      }

      if (error.response?.status === 400 || error.response?.status === 404) {
        toast.error(error.response?.data?.error || 'Erro ao processar registro')
      } else if (error.response?.data?.message) {
        toast.error(error.response?.data?.message)
      } else {
        toast.error('Não foi possível completar o registro. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Validando link de convite...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary">Registro de Membro</h1>
          {linkInfo && (
            <p className="text-center text-gray-600 mb-6">
              Bem-vindo(a) à <strong>{linkInfo.churchName}</strong>
              <br />
              Filial: <strong>{linkInfo.branchName}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
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
                Email *
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
                Senha *
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                  className="input"
                />
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
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL da Foto de Perfil (opcional)
              </label>
              <input
                id="avatarUrl"
                type="url"
                {...register('avatarUrl')}
                className="input"
                placeholder="https://exemplo.com/foto.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Você pode fazer upload da foto em um serviço de hospedagem de imagens e colar o link aqui
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Registrando...' : 'Completar Registro'}
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




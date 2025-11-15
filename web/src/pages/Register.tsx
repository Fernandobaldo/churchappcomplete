import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>()

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      let response
      
      // Tenta primeiro o endpoint /register como descrito no prompt (com churchName)
      try {
        response = await api.post('/register', {
          name: data.name,
          email: data.email,
          password: data.password,
          churchName: data.churchName,
        })
      } catch (firstError: any) {
        // Se falhar, tenta o endpoint /public/register e depois cria a igreja
        if (firstError.response?.status === 400 || firstError.response?.status === 404) {
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
          
          navigate('/onboarding/bem-vindo')
          return
        }
        throw firstError
      }

      const { token } = response.data

      if (!token) {
        throw new Error('Token não recebido do servidor')
      }

      setUserFromToken(token)
      toast.success('Conta criada com sucesso!')
      navigate('/onboarding/bem-vindo')
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


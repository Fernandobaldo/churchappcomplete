import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../stores/adminAuthStore'
import { adminAuthApi } from '../api/adminApi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export function AdminLogin() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAdminAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await adminAuthApi.login(data.email, data.password)
      login(response.token, response.admin)
      toast.success('Login realizado com sucesso!')
      navigate('/admin/dashboard')
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-admin-light">
            <LogIn className="h-6 w-6 text-admin-dark" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Portal Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acesso restrito para administradores do SaaS
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-admin focus:border-admin focus:z-10 sm:text-sm"
                placeholder="Email"
                data-testid="admin-login-email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter no mínimo 6 caracteres',
                  },
                })}
                id="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-admin focus:border-admin focus:z-10 sm:text-sm"
                placeholder="Senha"
                data-testid="admin-login-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-admin hover:bg-admin-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="admin-login-submit"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


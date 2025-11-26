import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'

interface MemberForm {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  birthDate?: string
  role: 'MEMBER' | 'COORDINATOR' | 'ADMINFILIAL' | 'ADMINGERAL'
}

export default function AddMember() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    defaultValues: {
      role: 'MEMBER',
    },
  })

  const onSubmit = async (data: MemberForm) => {
    try {
      await api.post('/register', data)
      toast.success('Membro criado com sucesso!')
      navigate('/app/members')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar membro')
    }
  }

  return (
    <div className="space-y-6">
      <button
        data-testid="back-button"
        onClick={() => navigate('/app/members')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Novo Membro</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              data-testid="name-input"
              {...register('name', { required: 'Nome é obrigatório' })}
              className="input"
              placeholder="Nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                data-testid="email-input"
                type="email"
                {...register('email', { required: 'Email é obrigatório' })}
                className="input"
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <input
                data-testid="password-input"
                type="password"
                {...register('password', { required: 'Senha é obrigatória', minLength: 6 })}
                className="input"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                {...register('birthDate')}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <input
              {...register('address')}
              className="input"
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função *
            </label>
            <select
              data-testid="role-select"
              {...register('role', { required: 'Função é obrigatória' })}
              className="input"
            >
              <option value="MEMBER">Membro</option>
              <option value="COORDINATOR">Coordenador</option>
              <option value="ADMINFILIAL">Admin Filial</option>
              <option value="ADMINGERAL">Admin Geral</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              data-testid="cancel-button"
              type="button"
              onClick={() => navigate('/app/members')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button data-testid="submit-button" type="submit" className="btn-primary flex-1">
              Criar Membro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

interface ProfileForm {
  name: string
  email: string
  phone?: string
  address?: string
  birthDate?: string
}

export default function Profile() {
  const { user, setUserFromToken } = useAuthStore()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>()

  useEffect(() => {
    if (user) {
      setValue('name', user.name)
      setValue('email', user.email)
    }
  }, [user, setValue])

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return

    try {
      await api.put(`/members/${user.id}`, data)
      toast.success('Perfil atualizado com sucesso!')
      // Recarrega os dados do usuário
      const profileResponse = await api.get('/members/me')
      // Se necessário, atualizar o token se o backend retornar um novo
      // Por enquanto, apenas recarregamos a página para refletir as mudanças
      window.location.reload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-primary font-semibold text-3xl">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary-light text-primary rounded text-sm font-medium">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome *
            </label>
            <input
              {...register('name', { required: 'Nome é obrigatório' })}
              className="input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email é obrigatório' })}
              className="input"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </label>
            <input
              {...register('address')}
              className="input"
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Nascimento
            </label>
            <input
              type="date"
              {...register('birthDate')}
              className="input"
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


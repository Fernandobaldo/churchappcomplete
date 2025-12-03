import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Calendar } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'

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
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MemberForm>({
    defaultValues: {
      role: 'MEMBER',
    },
  })
  const [birthDateDisplay, setBirthDateDisplay] = useState<string>('')

  // Função para formatar data para dd/mm/yyyy
  const formatDateToDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    if (dateString.includes('/')) {
      return dateString
    }
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date())
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy')
      }
    } catch (e) {
      // Se falhar, retorna como está
    }
    return dateString
  }

  // Função para converter dd/mm/yyyy para yyyy-MM-dd (para enviar ao backend)
  const formatDateToISO = (dateString: string): string => {
    if (!dateString) return ''
    const cleaned = dateString.replace(/\D/g, '')
    if (cleaned.length !== 8) return dateString
    
    const day = cleaned.substring(0, 2)
    const month = cleaned.substring(2, 4)
    const year = cleaned.substring(4, 8)
    
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return dateString
    }
    
    return `${year}-${month}-${day}`
  }

  // Função para aplicar máscara dd/mm/yyyy enquanto digita
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    let value = inputValue.replace(/\D/g, '')
    
    if (value === '' || inputValue === '') {
      setBirthDateDisplay('')
      setValue('birthDate', '', { shouldValidate: false })
      return
    }
    
    if (value.length > 8) {
      value = value.substring(0, 8)
    }
    
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2)
    }
    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5)
    }
    
    setBirthDateDisplay(value)
    
    if (value.length === 10) {
      const isoDate = formatDateToISO(value)
      setValue('birthDate', isoDate, { shouldValidate: true })
    } else {
      setValue('birthDate', '', { shouldValidate: false })
    }
  }

  const onSubmit = async (data: MemberForm) => {
    try {
      // Converter birthDate de ISO para dd/mm/yyyy se necessário
      const submitData = { ...data }
      if (submitData.birthDate && submitData.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se está em formato ISO, converter para dd/mm/yyyy
        try {
          const date = parse(submitData.birthDate, 'yyyy-MM-dd', new Date())
          if (isValid(date)) {
            submitData.birthDate = format(date, 'dd/MM/yyyy')
          }
        } catch (e) {
          // Se falhar, usar birthDateDisplay se disponível
          if (birthDateDisplay && birthDateDisplay.length === 10) {
            submitData.birthDate = birthDateDisplay
          }
        }
      } else if (birthDateDisplay && birthDateDisplay.length === 10) {
        // Se birthDateDisplay tem valor válido, usar ele
        submitData.birthDate = birthDateDisplay
      } else if (!submitData.birthDate || submitData.birthDate.trim() === '') {
        // Se estiver vazio, não enviar
        delete submitData.birthDate
      }

      await api.post('/register', submitData)
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
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Nascimento
              </label>
              <input
                type="text"
                value={birthDateDisplay}
                onChange={handleBirthDateChange}
                onBlur={(e) => {
                  const inputValue = e.target.value.trim()
                  if (inputValue === '' && birthDateDisplay !== '') {
                    setBirthDateDisplay('')
                    setValue('birthDate', '', { shouldValidate: false })
                    return
                  }
                  
                  if (inputValue !== birthDateDisplay && inputValue !== '') {
                    if (inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                      setBirthDateDisplay(inputValue)
                    } else if (inputValue.match(/^\d{2}\/\d{2}$/)) {
                      setBirthDateDisplay(inputValue)
                    }
                  }
                  
                  const valueToCheck = inputValue || birthDateDisplay || ''
                  if (valueToCheck.length > 0 && valueToCheck.length < 10) {
                    toast.error('Data inválida. Use o formato dd/mm/yyyy')
                  }
                }}
                className="input"
                placeholder="dd/mm/yyyy"
                maxLength={10}
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


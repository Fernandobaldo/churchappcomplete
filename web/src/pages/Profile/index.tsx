import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone, MapPin, Calendar, Save, Upload, X } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { hasAccess } from '../../utils/authUtils'
import { format, parse, isValid } from 'date-fns'

interface ProfileForm {
  name: string
  email: string
  phone?: string
  address?: string
  birthDate?: string
  positionId?: string | null
}

interface Position {
  id: string
  name: string
  isDefault: boolean
}

export default function Profile() {
  const { user, setUserFromToken, updateUser } = useAuthStore()
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<ProfileForm>()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [birthDateDisplay, setBirthDateDisplay] = useState<string>('')
  
  // Função para formatar data para dd/mm/yyyy
  const formatDateToDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    // Se já está no formato dd/mm/yyyy, retorna
    if (dateString.includes('/')) {
      return dateString
    }
    // Se está no formato yyyy-MM-dd (do input date), converte
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date())
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy')
      }
    } catch (e) {
      // Se falhar, tenta outros formatos
    }
    return dateString
  }
  
  // Função para converter dd/mm/yyyy para yyyy-MM-dd (para enviar ao backend)
  const formatDateToISO = (dateString: string): string => {
    if (!dateString) return ''
    // Remove caracteres não numéricos
    const cleaned = dateString.replace(/\D/g, '')
    if (cleaned.length !== 8) return dateString
    
    // Formato: dd/mm/yyyy -> yyyy-MM-dd
    const day = cleaned.substring(0, 2)
    const month = cleaned.substring(2, 4)
    const year = cleaned.substring(4, 8)
    
    // Validação básica
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
    let value = inputValue.replace(/\D/g, '') // Remove tudo que não é dígito
    
    // Se o valor foi completamente limpo, atualizar estado
    if (value === '' || inputValue === '') {
      setBirthDateDisplay('')
      setValue('birthDate', '', { shouldValidate: false })
      return
    }
    
    if (value.length > 8) {
      value = value.substring(0, 8)
    }
    
    // Aplica máscara dd/mm/yyyy
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2)
    }
    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5)
    }
    
    setBirthDateDisplay(value)
    
    // Atualiza o valor do formulário no formato ISO para validação
    if (value.length === 10) {
      const isoDate = formatDateToISO(value)
      setValue('birthDate', isoDate, { shouldValidate: true })
    } else {
      setValue('birthDate', '', { shouldValidate: false })
    }
  }

  // Carregar posições na primeira carga
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const positionsResponse = await api.get('/positions')
        // Garantir que positions seja sempre um array
        setPositions(Array.isArray(positionsResponse.data) ? positionsResponse.data : [])
        setIsInitialLoad(false)
      } catch (error) {
        console.error('Erro ao carregar cargos:', error)
      }
    }
    
    if (isInitialLoad) {
      loadPositions()
    }
  }, [isInitialLoad])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.memberId) return
      
      try {
        const profileResponse = await api.get('/members/me')
        const profile = profileResponse.data
        
        console.log('[FRONTEND DEBUG] ========== RESPOSTA DO BACKEND ==========')
        console.log('[FRONTEND DEBUG] Resposta completa:', profileResponse)
        console.log('[FRONTEND DEBUG] profileResponse.data:', profileResponse.data)
        console.log('[FRONTEND DEBUG] profileResponse.data (stringified):', JSON.stringify(profileResponse.data, null, 2))
        console.log('[FRONTEND DEBUG] profile keys:', Object.keys(profile))
        console.log('[FRONTEND DEBUG] profile.positionId:', profile.positionId)
        console.log('[FRONTEND DEBUG] profile.positionId (type):', typeof profile.positionId)
        console.log('[FRONTEND DEBUG] profile.position:', profile.position)
        console.log('[FRONTEND DEBUG] profile.position (type):', typeof profile.position)
        console.log('[FRONTEND DEBUG] has positionId:', 'positionId' in profile)
        console.log('[FRONTEND DEBUG] has position:', 'position' in profile)
        console.log('[FRONTEND DEBUG] ========================================')
        
        // Preparar dados do formulário
        // Data de nascimento: backend retorna dd/MM/yyyy, manter no formato brasileiro
        const birthDateDisplayValue = profile.birthDate ? formatDateToDisplay(profile.birthDate) : ''
        setBirthDateDisplay(birthDateDisplayValue)
        
        // Para o formulário, converter para ISO se necessário (mas não vamos usar input date)
        let birthDateFormatted = ''
        if (profile.birthDate) {
          // Backend já retorna dd/MM/yyyy, converter para ISO apenas para validação interna
          const [day, month, year] = profile.birthDate.split('/')
          if (day && month && year) {
            birthDateFormatted = `${year}-${month}-${day}`
          }
        }
        
        // Usar positionId do profile, ou do position.id se positionId não estiver presente
        const positionId = profile.positionId ?? profile.position?.id ?? null
        
        console.log('PositionId que será usado no formulário:', positionId)
        console.log('Positions disponíveis:', positions)
        
        // Usar reset para atualizar todos os valores do formulário de uma vez
        // Converter positionId para string se necessário
        const positionIdValue = positionId ? String(positionId) : ''
        
        reset({
          name: profile.name || user.name || '',
          email: profile.email || user.email || '',
          phone: profile.phone !== null && profile.phone !== undefined ? profile.phone : '',
          address: profile.address !== null && profile.address !== undefined ? profile.address : '',
          birthDate: birthDateFormatted, // Mantido para validação interna
          positionId: positionIdValue,
        })
        
        console.log('Formulário resetado com positionId:', positionIdValue)
        
        if (profile.avatarUrl) {
          setCurrentAvatarUrl(profile.avatarUrl)
        } else {
          setCurrentAvatarUrl(null)
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar dados do perfil')
      }
    }
    
    // Aguardar um pouco para garantir que as posições foram carregadas
    if (!isInitialLoad) {
      loadProfile()
    }
  }, [user?.memberId, reset, isInitialLoad, positions.length])

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

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return
    setLoading(true)

    // Usa memberId se disponível, caso contrário busca do endpoint /members/me
    let memberId = user.memberId
    if (!memberId) {
      try {
        const profileResponse = await api.get('/members/me')
        memberId = profileResponse.data.id
      } catch (error: any) {
        toast.error('Não foi possível obter o ID do membro. Faça login novamente.')
        setLoading(false)
        return
      }
    }

    try {
      let avatarUrl: string | undefined = undefined

      // Upload do avatar se houver
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
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload do avatar:', uploadError)
          toast.error('Erro ao fazer upload da imagem')
          setLoading(false)
          return
        }
      }

      // Preparar dados para atualização
      const updateData: any = {}
      
      // Nome é obrigatório - se não passar na validação, o react-hook-form não chama onSubmit
      // Mas garantimos aqui também
      if (data.name && data.name.trim() !== '') {
        updateData.name = data.name.trim()
      } else {
        // Se o nome estiver vazio ou apenas espaços, não deve prosseguir
        toast.error('Nome é obrigatório')
        setLoading(false)
        return
      }
      
      // Email não pode ser alterado pelo próprio usuário
      // Removido: if (data.email && data.email.trim() !== '') { updateData.email = ... }
      
      // Campos opcionais: sempre incluir no updateData
      // react-hook-form sempre inclui campos registrados no data, mesmo que vazios
      // Se o campo foi limpo (string vazia após trim), enviar null para remover
      // IMPORTANTE: Sempre incluir phone e address para garantir que campos limpos sejam removidos
      updateData.phone = (data.phone || '').trim() || null
      updateData.address = (data.address || '').trim() || null
      
      // Data de nascimento: usar o valor do display (dd/mm/yyyy)
      // Verificar birthDateDisplay diretamente - se estiver vazio, enviar null
      const birthDateValue = birthDateDisplay?.trim() || ''
      
      if (birthDateValue && birthDateValue !== '') {
        // Se está no formato dd/mm/yyyy, usar diretamente
        if (birthDateValue.includes('/') && birthDateValue.length === 10) {
          updateData.birthDate = birthDateValue
        } else if (data.birthDate && data.birthDate.trim() !== '') {
          // Se data.birthDate tem valor (formato ISO), converter para dd/mm/yyyy
          try {
            const date = parse(data.birthDate, 'yyyy-MM-dd', new Date())
            if (isValid(date)) {
              updateData.birthDate = format(date, 'dd/MM/yyyy')
            } else {
              // Se não conseguir converter, não enviar
              updateData.birthDate = null
            }
          } catch (e) {
            updateData.birthDate = null
          }
        } else {
          // Se o valor não está completo, não enviar
          updateData.birthDate = null
        }
      } else {
        // Se estiver vazia, enviar null para remover
        updateData.birthDate = null
      }
      
      // Não permite alterar positionId no próprio perfil
      // O cargo só pode ser alterado por administradores na página de detalhes do membro

      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl
      }

      const response = await api.put(`/members/${memberId}`, updateData)
      const updatedProfile = response.data
      
      toast.success('Perfil atualizado com sucesso!')
      
      // Atualizar o nome no authStore para refletir no header
      if (updatedProfile.name && updatedProfile.name !== user?.name) {
        updateUser({ name: updatedProfile.name })
      }
      
      // Email não é atualizado pelo próprio usuário, então não precisamos atualizar no store
      
      // Limpar preview do avatar
      setAvatarFile(null)
      setAvatarPreview(null)
      
      // Preparar dados do formulário usando os dados retornados pela atualização
      // IMPORTANTE: Manter null/vazio para campos que foram removidos
      // Data de nascimento: backend retorna dd/MM/yyyy, manter no formato brasileiro
      const updatedBirthDateDisplay = updatedProfile.birthDate ? formatDateToDisplay(updatedProfile.birthDate) : ''
      setBirthDateDisplay(updatedBirthDateDisplay)
      
      let birthDateFormatted = ''
      if (updatedProfile.birthDate && updatedProfile.birthDate !== null && updatedProfile.birthDate !== '') {
        // Backend retorna dd/MM/yyyy, converter para ISO apenas para validação interna
        const [day, month, year] = updatedProfile.birthDate.split('/')
        if (day && month && year) {
          birthDateFormatted = `${year}-${month}-${day}`
        }
      }
      
      // Usar reset para atualizar todos os valores do formulário com os dados atualizados
      // Campos removidos (null) devem permanecer vazios no formulário
      // IMPORTANTE: Não usar valores do user como fallback para campos opcionais que foram removidos
      reset({
        name: updatedProfile.name || user.name || '',
        email: updatedProfile.email || user.email || '',
        phone: updatedProfile.phone ?? '', // null ou undefined vira string vazia (campo removido)
        address: updatedProfile.address ?? '', // null ou undefined vira string vazia (campo removido)
        birthDate: birthDateFormatted, // já está vazio se birthDate for null
        positionId: updatedProfile.positionId ?? null,
      })
      
      console.log('[PROFILE UPDATE] Formulário atualizado após salvar:', {
        phone: updatedProfile.phone,
        address: updatedProfile.address,
        birthDate: updatedProfile.birthDate,
        birthDateDisplay: updatedBirthDateDisplay,
        phoneFormatted: updatedProfile.phone ?? '',
        addressFormatted: updatedProfile.address ?? '',
      })
      
      if (updatedProfile.avatarUrl) {
        setCurrentAvatarUrl(updatedProfile.avatarUrl)
      } else {
        setCurrentAvatarUrl(null)
      }
      
      // Atualizar o usuário no store se necessário
      if (updatedProfile.name && updatedProfile.email) {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            setUserFromToken(token)
          } catch (error) {
            console.error('Erro ao atualizar usuário no store:', error)
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  // Verifica se pode alterar cargo: ADMINGERAL, ADMINFILIAL, COORDINATOR ou tem members_manage
  const canChangePosition = 
    user?.role === 'ADMINGERAL' || 
    user?.role === 'ADMINFILIAL' || 
    user?.role === 'COORDINATOR' || 
    hasAccess(user, 'members_manage')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          {avatarPreview || currentAvatarUrl ? (
            <div className="relative">
              <img
                src={avatarPreview || (currentAvatarUrl?.startsWith('http') ? currentAvatarUrl : `${api.defaults.baseURL}${currentAvatarUrl}`)}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
              />
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center">
              <span className="text-primary font-semibold text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary-light text-primary rounded text-sm font-medium">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
            Foto de perfil
          </label>
          {!avatarPreview && (
            <label
              htmlFor="avatar"
              className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <div className="text-center">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Adicionar foto</span>
              </div>
            </label>
          )}
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-gray-500">Máximo 5MB</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome *
            </label>
            <input
              id="name"
              {...register('name', { 
                required: 'Nome é obrigatório',
                validate: {
                  notEmpty: (value) => {
                    if (!value || typeof value !== 'string') {
                      return 'Nome é obrigatório'
                    }
                    if (value.trim() === '') {
                      return 'Nome é obrigatório'
                    }
                    return true
                  }
                }
              })}
              className="input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="input bg-gray-50 cursor-not-allowed"
                disabled={true}
                readOnly={true}
                title="O email não pode ser alterado. Entre em contato com um administrador para alterar seu email."
              />
              <p className="mt-1 text-xs text-gray-500">
                O email não pode ser alterado pelo próprio usuário. Entre em contato com um administrador para alterar seu email.
              </p>
            </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4" />
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
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </label>
            <input
              id="address"
              {...register('address')}
              className="input"
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Nascimento
            </label>
            <input
              id="birthDate"
              type="text"
              value={birthDateDisplay}
              onChange={handleBirthDateChange}
              onBlur={(e) => {
                // Sincronizar birthDateDisplay com o valor do input caso tenha sido alterado externamente (ex: user.clear())
                const inputValue = e.target.value.trim()
                if (inputValue === '' && birthDateDisplay !== '') {
                  setBirthDateDisplay('')
                  setValue('birthDate', '', { shouldValidate: false })
                  return
                }
                
                // Atualizar birthDateDisplay se o inputValue for diferente (caso tenha sido alterado externamente)
                if (inputValue !== birthDateDisplay && inputValue !== '') {
                  // Se o valor do input tem formato válido, atualizar birthDateDisplay
                  if (inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    setBirthDateDisplay(inputValue)
                  } else if (inputValue.match(/^\d{2}\/\d{2}$/)) {
                    // Data incompleta - manter como está para validação
                    setBirthDateDisplay(inputValue)
                  }
                }
                
                // Validação ao sair do campo: se tem algum valor mas não está completo (10 caracteres)
                // Verificar tanto inputValue quanto birthDateDisplay para garantir que a validação funcione
                const valueToCheck = inputValue || birthDateDisplay || ''
                if (valueToCheck.length > 0 && valueToCheck.length < 10) {
                  toast.error('Data inválida. Use o formato dd/mm/yyyy')
                }
              }}
              className="input"
              placeholder="dd/mm/yyyy"
              maxLength={10}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-1">
              Cargo na Igreja
            </label>
            <select
              id="positionId"
              {...register('positionId')}
              className="input bg-gray-50 cursor-not-allowed"
              disabled={true}
              readOnly={true}
              value={watch('positionId') || ''}
              title="O cargo na igreja não pode ser alterado pelo próprio usuário. Entre em contato com um administrador para alterar seu cargo."
            >
              <option value="">Nenhum cargo</option>
              {Array.isArray(positions) && positions.map((position) => (
                <option key={position.id} value={String(position.id)}>
                  {position.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              O cargo na igreja não pode ser alterado pelo próprio usuário. Entre em contato com um administrador para alterar seu cargo.
            </p>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


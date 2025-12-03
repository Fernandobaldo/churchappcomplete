import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Settings, Plus, Building2, Upload, X } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { hasAccess } from '../../utils/authUtils'
import ServiceScheduleList from './ServiceScheduleList'
import ServiceScheduleForm from './ServiceScheduleForm'
import { ServiceSchedule, serviceScheduleApi } from '../../api/serviceScheduleApi'

interface ChurchForm {
  name: string
  logoUrl?: string
}

interface Church {
  id: string
  name: string
  logoUrl?: string
  avatarUrl?: string
  isActive: boolean
}

export default function ChurchSettings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [church, setChurch] = useState<Church | null>(null)
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ServiceSchedule | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ChurchForm>()

  const canManageChurch = hasAccess(user, 'church_manage')

  useEffect(() => {
    if (!canManageChurch) {
      toast.error('Você não tem permissão para acessar as configurações da igreja.')
      navigate('/app/dashboard')
      return
    }

    fetchChurchData()
    fetchSchedules()
  }, [canManageChurch, navigate, user?.branchId])

  const fetchChurchData = async () => {
    try {
      // Busca a igreja através da filial do usuário
      if (!user?.branchId) {
        toast.error('Usuário não está associado a uma filial.')
        return
      }

      // Busca todas as igrejas e filtra pela filial do usuário
      const churchesResponse = await api.get('/churches')
      const churches = churchesResponse.data

      // Encontra a igreja que contém a filial do usuário
      let userChurch: Church | null = null
      for (const church of churches) {
        if (church.Branch && Array.isArray(church.Branch)) {
          const hasUserBranch = church.Branch.some((b: any) => b.id === user.branchId)
          if (hasUserBranch) {
            userChurch = {
              id: church.id,
              name: church.name,
              logoUrl: church.logoUrl,
              avatarUrl: church.avatarUrl,
              isActive: church.isActive,
            }
            break
          }
        }
      }

      if (userChurch) {
        setChurch(userChurch)
        setValue('name', userChurch.name)
        if (userChurch.logoUrl) {
          setValue('logoUrl', userChurch.logoUrl)
        }
        if (userChurch.avatarUrl) {
          setCurrentAvatarUrl(userChurch.avatarUrl)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da igreja:', error)
      toast.error('Erro ao carregar dados da igreja')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    if (!user?.branchId) return

    try {
      const data = await serviceScheduleApi.getByBranch(user.branchId)
      setSchedules(data)
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error)
      // Não mostra toast de erro aqui para não poluir a interface
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    if (avatarFile) {
      // Se há um arquivo novo selecionado, apenas remove o preview
      setAvatarFile(null)
      setAvatarPreview(null)
    } else {
      // Se não há arquivo novo, remove o avatar atual
      setCurrentAvatarUrl(null)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('file', avatarFile)

      const response = await api.post('/upload/church-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error)
      toast.error(error.response?.data?.error || 'Erro ao fazer upload do avatar')
      throw error
    } finally {
      setUploadingAvatar(false)
    }
  }

  const onSubmit = async (data: ChurchForm) => {
    if (!church) return

    try {
      let avatarUrl = currentAvatarUrl

      // Se há um novo arquivo de avatar, faz upload primeiro
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
        if (!avatarUrl) {
          toast.error('Erro ao fazer upload do avatar')
          return
        }
      }

      // Se o usuário removeu o avatar (currentAvatarUrl foi removido e não há novo arquivo)
      const finalAvatarUrl = avatarUrl !== undefined 
        ? avatarUrl 
        : (!currentAvatarUrl && !avatarFile) 
          ? null 
          : undefined

      await api.put(`/churches/${church.id}`, {
        name: data.name,
        logoUrl: data.logoUrl || undefined,
        avatarUrl: finalAvatarUrl,
      })
      
      toast.success('Configurações da igreja atualizadas com sucesso!')
      setAvatarFile(null)
      setAvatarPreview(null)
      fetchChurchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configurações da igreja')
    }
  }

  const handleScheduleCreated = () => {
    setShowScheduleForm(false)
    setEditingSchedule(null)
    fetchSchedules()
  }

  const handleEditSchedule = (schedule: ServiceSchedule) => {
    setEditingSchedule(schedule)
    setShowScheduleForm(true)
  }

  const handleDeleteSchedule = async (id: string, deleteEvents: boolean = false) => {
    try {
      const result = await serviceScheduleApi.delete(id, deleteEvents)
      
      let message = 'Horário deletado com sucesso!'
      if (deleteEvents && result.deletedEventsCount > 0) {
        message += ` ${result.deletedEventsCount} evento(s) também foram deletado(s).`
      }
      
      toast.success(message)
      fetchSchedules()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao deletar horário')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!canManageChurch) {
    return null
  }

  if (!church) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Igreja não encontrada.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Configurações da Igreja
        </h1>
        <p className="text-gray-600 mt-1">Gerencie as informações e horários de culto da sua igreja</p>
      </div>

      {/* Formulário de edição da igreja */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {(avatarPreview || currentAvatarUrl) ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden group">
                <img
                  src={avatarPreview || (currentAvatarUrl?.startsWith('http') ? currentAvatarUrl : `${api.defaults.baseURL}${currentAvatarUrl}`)}
                  alt="Avatar da Igreja"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover avatar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Informações da Igreja</h2>
            <p className="text-gray-600">Atualize os dados básicos da sua igreja</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="church-avatar" className="block text-sm font-medium text-gray-700 mb-1">
              Avatar da Igreja
            </label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="avatar-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {avatarFile ? 'Alterar Avatar' : 'Selecionar Avatar'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {avatarFile && (
                <span className="text-sm text-gray-600">{avatarFile.name}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              O avatar da igreja será usado como padrão para todos os membros que não tiverem avatar próprio.
            </p>
          </div>

          <div>
            <label htmlFor="church-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Igreja *
            </label>
            <input
              id="church-name"
              {...register('name', { required: 'Nome é obrigatório' })}
              className="input"
              placeholder="Nome completo da igreja"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="church-logo" className="block text-sm font-medium text-gray-700 mb-1">
              URL do Logo (opcional)
            </label>
            <input
              id="church-logo"
              {...register('logoUrl')}
              type="url"
              className="input"
              placeholder="https://exemplo.com/logo.png"
            />
            {errors.logoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Enviando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Seção de Horários de Culto */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Horários de Culto</h2>
            <p className="text-gray-600 mt-1">Configure os horários regulares de culto da sua filial</p>
          </div>
          {!showScheduleForm && (
            <button
              onClick={() => {
                setEditingSchedule(null)
                setShowScheduleForm(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Horário
            </button>
          )}
        </div>

        {showScheduleForm ? (
          <ServiceScheduleForm
            branchId={user?.branchId || ''}
            schedule={editingSchedule || undefined}
            onCancel={() => {
              setShowScheduleForm(false)
              setEditingSchedule(null)
            }}
            onSuccess={handleScheduleCreated}
          />
        ) : (
          <ServiceScheduleList
            schedules={schedules}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
            onRefresh={fetchSchedules}
          />
        )}
      </div>
    </div>
  )
}


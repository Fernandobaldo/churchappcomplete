import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Settings, Plus, Building2 } from 'lucide-react'
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

  const onSubmit = async (data: ChurchForm) => {
    if (!church) return

    try {
      await api.put(`/churches/${church.id}`, {
        name: data.name,
        logoUrl: data.logoUrl || undefined,
      })
      toast.success('Configurações da igreja atualizadas com sucesso!')
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
          <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Informações da Igreja</h2>
            <p className="text-gray-600">Atualize os dados básicos da sua igreja</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <button type="submit" className="btn-primary">
            Salvar Alterações
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


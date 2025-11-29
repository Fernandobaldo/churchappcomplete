import { Pencil, Trash2, Star, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react'
import { ServiceSchedule } from '../../api/serviceScheduleApi'
import { serviceScheduleApi } from '../../api/serviceScheduleApi'
import toast from 'react-hot-toast'

interface ServiceScheduleListProps {
  schedules: ServiceSchedule[]
  onEdit: (schedule: ServiceSchedule) => void
  onDelete: (id: string, deleteEvents: boolean) => void
  onRefresh: () => void
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export default function ServiceScheduleList({
  schedules,
  onEdit,
  onDelete,
  onRefresh,
}: ServiceScheduleListProps) {
  const handleSetDefault = async (id: string) => {
    try {
      await serviceScheduleApi.setDefault(id)
      toast.success('Horário definido como padrão!')
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao definir horário como padrão')
    }
  }

  const handleCreateEvents = async (schedule: ServiceSchedule) => {
    if (!confirm(`Criar eventos a partir do horário "${schedule.title}"?`)) return

    try {
      const result = await serviceScheduleApi.createEvents(schedule.id)
      toast.success(`${result.created} eventos criados com sucesso!`)
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar eventos')
    }
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Nenhum horário de culto cadastrado.</p>
        <p className="text-sm mt-1">Clique em "Adicionar Horário" para começar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className={`border rounded-lg p-4 ${
            schedule.isDefault ? 'border-primary bg-primary-light/5' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{schedule.title}</h3>
                {schedule.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-white rounded text-xs font-medium">
                    <Star className="w-3 h-3" />
                    Padrão
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{DAYS_OF_WEEK[schedule.dayOfWeek]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{schedule.time}</span>
                </div>
                {schedule.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{schedule.location}</span>
                  </div>
                )}
                {schedule.autoCreateEvents && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      Auto-criar eventos ({schedule.autoCreateDaysAhead || 90} dias)
                    </span>
                  </div>
                )}
              </div>

              {schedule.description && (
                <p className="mt-2 text-sm text-gray-600">{schedule.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {!schedule.isDefault && (
                <button
                  onClick={() => handleSetDefault(schedule.id)}
                  className="p-2 text-gray-500 hover:text-primary transition-colors"
                  title="Definir como padrão"
                >
                  <Star className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => handleCreateEvents(schedule)}
                className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                title="Criar eventos a partir deste horário"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEdit(schedule)}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="Editar"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    // Conta eventos relacionados antes de mostrar a confirmação
                    const { count, scheduleTitle } = await serviceScheduleApi.getRelatedEventsCount(schedule.id)
                    
                    let message = `Tem certeza que deseja deletar o horário "${scheduleTitle}"?`
                    if (count > 0) {
                      message += `\n\n⚠️ ATENÇÃO: Ao deletar este horário de culto, ${count} evento(s) criado(s) a partir dele também serão deletados.`
                    }
                    
                    const confirmed = window.confirm(message)
                    if (!confirmed) {
                      return // Usuário cancelou a confirmação
                    }
                    
                    // Sempre deleta os eventos relacionados quando deletar o horário
                    onDelete(schedule.id, true)
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Erro ao verificar eventos relacionados')
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Deletar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


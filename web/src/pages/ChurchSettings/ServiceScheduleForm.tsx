import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Save } from 'lucide-react'
import { serviceScheduleApi, ServiceSchedule, CreateServiceScheduleData } from '../../api/serviceScheduleApi'
import toast from 'react-hot-toast'

interface ServiceScheduleFormProps {
  branchId: string
  schedule?: ServiceSchedule
  onCancel: () => void
  onSuccess: () => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export default function ServiceScheduleForm({
  branchId,
  schedule,
  onCancel,
  onSuccess,
}: ServiceScheduleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateServiceScheduleData>({
    defaultValues: {
      branchId,
      dayOfWeek: 0,
      time: '10:00',
      title: '',
      description: '',
      location: '',
      isDefault: false,
      autoCreateEvents: false,
      autoCreateDaysAhead: 90,
    },
  })

  const autoCreateEvents = watch('autoCreateEvents')

  useEffect(() => {
    if (schedule) {
      setValue('branchId', schedule.branchId)
      setValue('dayOfWeek', schedule.dayOfWeek)
      setValue('time', schedule.time)
      setValue('title', schedule.title)
      setValue('description', schedule.description || '')
      setValue('location', schedule.location || '')
      setValue('isDefault', schedule.isDefault)
      setValue('autoCreateEvents', schedule.autoCreateEvents)
      setValue('autoCreateDaysAhead', schedule.autoCreateDaysAhead || 90)
    }
  }, [schedule, setValue])

  const onSubmit = async (data: CreateServiceScheduleData) => {
    try {
      if (schedule) {
        const result = await serviceScheduleApi.update(schedule.id, data)
        if (result.updatedEventsCount && result.updatedEventsCount > 0) {
          toast.success(`Horário atualizado com sucesso! ${result.updatedEventsCount} evento(s) relacionado(s) também foram atualizado(s).`)
        } else {
          toast.success('Horário atualizado com sucesso!')
        }
      } else {
        await serviceScheduleApi.create(data)
        toast.success('Horário criado com sucesso!')
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar horário')
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {schedule ? 'Editar Horário' : 'Novo Horário de Culto'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia da Semana *
            </label>
            <select
              {...register('dayOfWeek', {
                required: 'Dia da semana é obrigatório',
                valueAsNumber: true,
              })}
              className="input"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="mt-1 text-sm text-red-600">{errors.dayOfWeek.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário *
            </label>
            <input
              {...register('time', {
                required: 'Horário é obrigatório',
                pattern: {
                  value: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
                  message: 'Horário deve estar no formato HH:mm',
                },
              })}
              type="time"
              className="input"
            />
            {errors.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            {...register('title', { required: 'Título é obrigatório' })}
            className="input"
            placeholder="Ex: Culto Dominical, Escola Bíblica"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            {...register('description')}
            className="input"
            rows={3}
            placeholder="Descrição opcional do horário"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localização
          </label>
          <input
            {...register('location')}
            className="input"
            placeholder="Ex: Templo Principal, Salão de Eventos"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('isDefault')}
            type="checkbox"
            id="isDefault"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
            Definir como horário padrão
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('autoCreateEvents')}
            type="checkbox"
            id="autoCreateEvents"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="autoCreateEvents" className="text-sm font-medium text-gray-700">
            Criar eventos automaticamente
          </label>
        </div>

        {autoCreateEvents && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dias à frente para criar eventos
            </label>
            <input
              {...register('autoCreateDaysAhead', {
                valueAsNumber: true,
                min: { value: 1, message: 'Mínimo 1 dia' },
                max: { value: 365, message: 'Máximo 365 dias' },
              })}
              type="number"
              min="1"
              max="365"
              className="input"
              placeholder="90"
            />
            {errors.autoCreateDaysAhead && (
              <p className="mt-1 text-sm text-red-600">
                {errors.autoCreateDaysAhead.message}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {schedule ? 'Atualizar' : 'Criar'} Horário
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}


import api from './api'

export interface ServiceSchedule {
  id: string
  branchId: string
  dayOfWeek: number // 0-6, onde 0 = Domingo
  time: string // HH:mm
  title: string
  description?: string
  location?: string
  isDefault: boolean
  autoCreateEvents: boolean
  autoCreateDaysAhead?: number
  createdAt: string
  updatedAt: string
}

export interface CreateServiceScheduleData {
  branchId: string
  dayOfWeek: number
  time: string
  title: string
  description?: string
  location?: string
  isDefault?: boolean
  autoCreateEvents?: boolean
  autoCreateDaysAhead?: number
}

export interface UpdateServiceScheduleData {
  branchId?: string
  dayOfWeek?: number
  time?: string
  title?: string
  description?: string
  location?: string
  isDefault?: boolean
  autoCreateEvents?: boolean
  autoCreateDaysAhead?: number
}

export interface CreateEventsOptions {
  startDate?: string // ISO string ou dd/MM/yyyy
  endDate?: string // ISO string ou dd/MM/yyyy
  daysAhead?: number // Quantos dias à frente criar eventos
}

export const serviceScheduleApi = {
  /**
   * Lista todos os horários de culto de uma filial
   */
  getByBranch: async (branchId: string): Promise<ServiceSchedule[]> => {
    const response = await api.get(`/service-schedules/branch/${branchId}`)
    return response.data
  },

  /**
   * Obtém um horário de culto por ID
   */
  getById: async (id: string): Promise<ServiceSchedule> => {
    const response = await api.get(`/service-schedules/${id}`)
    return response.data
  },

  /**
   * Cria um novo horário de culto
   */
  create: async (data: CreateServiceScheduleData): Promise<ServiceSchedule> => {
    const response = await api.post('/service-schedules', data)
    return response.data
  },

  /**
   * Atualiza um horário de culto
   */
  update: async (id: string, data: UpdateServiceScheduleData): Promise<ServiceSchedule & { updatedEventsCount?: number }> => {
    const response = await api.put(`/service-schedules/${id}`, data)
    return response.data
  },

  /**
   * Conta eventos relacionados a um horário de culto
   */
  getRelatedEventsCount: async (id: string): Promise<{
    count: number
    scheduleTitle: string
  }> => {
    const response = await api.get(`/service-schedules/${id}/related-events-count`)
    return response.data
  },

  /**
   * Deleta um horário de culto
   * @param id ID do horário
   * @param deleteEvents Se true, também deleta os eventos relacionados
   */
  delete: async (id: string, deleteEvents: boolean = false): Promise<{
    message: string
    deletedEventsCount: number
    relatedEventsCount: number
  }> => {
    const response = await api.delete(`/service-schedules/${id}`, {
      data: { deleteEvents },
    })
    return response.data
  },

  /**
   * Define um horário como padrão
   */
  setDefault: async (id: string): Promise<ServiceSchedule> => {
    const response = await api.patch(`/service-schedules/${id}/set-default`)
    return response.data
  },

  /**
   * Cria eventos a partir de um horário de culto
   */
  createEvents: async (id: string, options?: CreateEventsOptions): Promise<{
    created: number
    schedule: string
    period: {
      start: string
      end: string
    }
  }> => {
    const response = await api.post(`/service-schedules/${id}/create-events`, options || {})
    return response.data
  },
}


import { prisma } from '../lib/prisma'
import { parse, format, addDays, setHours, setMinutes, startOfDay } from 'date-fns'

interface CreateServiceScheduleData {
  branchId: string
  dayOfWeek: number // 0-6, onde 0 = Domingo
  time: string // HH:mm
  title: string
  description?: string
  location?: string
  isDefault?: boolean
  autoCreateEvents?: boolean
  autoCreateDaysAhead?: number
}

interface UpdateServiceScheduleData {
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

export class ServiceScheduleService {
  async create(data: CreateServiceScheduleData) {
    // Se for marcado como padrão, remove o padrão anterior da mesma filial
    if (data.isDefault) {
      await prisma.serviceSchedule.updateMany({
        where: {
          branchId: data.branchId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    return await prisma.serviceSchedule.create({
      data: {
        branchId: data.branchId,
        dayOfWeek: data.dayOfWeek,
        time: data.time,
        title: data.title,
        description: data.description,
        location: data.location,
        isDefault: data.isDefault ?? false,
        autoCreateEvents: data.autoCreateEvents ?? false,
        autoCreateDaysAhead: data.autoCreateDaysAhead ?? 90,
      },
    })
  }

  async getByBranchId(branchId: string) {
    return await prisma.serviceSchedule.findMany({
      where: { branchId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { time: 'asc' },
      ],
    })
  }

  async getById(id: string) {
    return await prisma.serviceSchedule.findUnique({
      where: { id },
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            churchId: true,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateServiceScheduleData) {
    const oldSchedule = await this.getById(id)
    if (!oldSchedule) {
      throw new Error('Horário não encontrado')
    }

    // Se for marcado como padrão, remove o padrão anterior da mesma filial
    if (data.isDefault) {
      await prisma.serviceSchedule.updateMany({
        where: {
          branchId: oldSchedule.branchId,
          isDefault: true,
          id: { not: id }, // Exclui o próprio registro
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updatedSchedule = await prisma.serviceSchedule.update({
      where: { id },
      data: {
        branchId: data.branchId,
        dayOfWeek: data.dayOfWeek,
        time: data.time,
        title: data.title,
        description: data.description,
        location: data.location,
        isDefault: data.isDefault,
        autoCreateEvents: data.autoCreateEvents,
        autoCreateDaysAhead: data.autoCreateDaysAhead,
      },
    })

    return {
      updated: updatedSchedule,
      old: oldSchedule,
    }
  }

  async delete(id: string) {
    return await prisma.serviceSchedule.delete({
      where: { id },
    })
  }

  /**
   * Conta eventos relacionados a um horário de culto
   * Eventos são identificados por: title, time e branchId iguais ao schedule
   * @param scheduleId ID do horário de culto
   * @returns Número de eventos relacionados encontrados
   */
  async countRelatedEvents(scheduleId: string): Promise<number> {
    const schedule = await this.getById(scheduleId)
    if (!schedule) {
      throw new Error('Horário não encontrado')
    }

    const count = await prisma.event.count({
      where: {
        title: schedule.title,
        time: schedule.time,
        branchId: schedule.branchId,
      },
    })

    return count
  }

  /**
   * Deleta todos os eventos relacionados a um horário de culto
   * Eventos são identificados por: title, time e branchId iguais ao schedule
   * @param scheduleId ID do horário de culto
   * @returns Número de eventos deletados
   */
  async deleteRelatedEvents(scheduleId: string): Promise<number> {
    const schedule = await this.getById(scheduleId)
    if (!schedule) {
      throw new Error('Horário não encontrado')
    }

    const result = await prisma.event.deleteMany({
      where: {
        title: schedule.title,
        time: schedule.time,
        branchId: schedule.branchId,
      },
    })

    return result.count
  }

  /**
   * Atualiza todos os eventos relacionados a um horário de culto quando o schedule é editado
   * Eventos são identificados usando os valores ANTIGOS do schedule (title, time, branchId)
   * e atualizados com os NOVOS valores (title, time, description, location)
   * @param oldSchedule Horário de culto antes da atualização
   * @param newSchedule Horário de culto após a atualização
   * @returns Número de eventos atualizados
   */
  async updateRelatedEvents(
    oldSchedule: { title: string; time: string; branchId: string },
    newSchedule: { title: string; time: string; description?: string | null; location?: string | null }
  ): Promise<number> {
    // Busca eventos relacionados usando os valores ANTIGOS
    const relatedEvents = await prisma.event.findMany({
      where: {
        title: oldSchedule.title,
        time: oldSchedule.time,
        branchId: oldSchedule.branchId,
      },
    })

    if (relatedEvents.length === 0) {
      return 0
    }

    // Prepara os dados de atualização
    const updateData: {
      title: string
      time: string
      description?: string
      location?: string
    } = {
      title: newSchedule.title,
      time: newSchedule.time,
    }

    // Atualiza description apenas se foi fornecido no novo schedule
    if (newSchedule.description !== undefined) {
      updateData.description = newSchedule.description || undefined
    }
    // Atualiza location se foi fornecido no novo schedule
    if (newSchedule.location !== undefined) {
      updateData.location = newSchedule.location || undefined
    }

    // Atualiza todos os eventos relacionados
    const result = await prisma.event.updateMany({
      where: {
        title: oldSchedule.title,
        time: oldSchedule.time,
        branchId: oldSchedule.branchId,
      },
      data: updateData,
    })

    return result.count
  }

  async setAsDefault(id: string, branchId: string) {
    // Remove o padrão anterior da mesma filial
    await prisma.serviceSchedule.updateMany({
      where: {
        branchId,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    })

    // Define o novo padrão
    return await prisma.serviceSchedule.update({
      where: { id },
      data: {
        isDefault: true,
      },
    })
  }

  /**
   * Cria eventos a partir de um horário de culto
   * @param scheduleId ID do horário
   * @param startDate Data de início (opcional, padrão: hoje)
   * @param endDate Data de fim (opcional, padrão: startDate + autoCreateDaysAhead dias)
   * @param daysAhead Quantos dias à frente criar eventos (opcional, usa autoCreateDaysAhead do schedule)
   */
  async createEventsFromSchedule(
    scheduleId: string,
    startDate?: string,
    endDate?: string,
    daysAhead?: number
  ) {
    const schedule = await this.getById(scheduleId)
    if (!schedule) {
      throw new Error('Horário não encontrado')
    }

    // Parse das datas
    let start: Date
    let end: Date

    if (startDate) {
      // Tenta parse ISO primeiro, depois dd/MM/yyyy
      const isoDate = new Date(startDate)
      if (!isNaN(isoDate.getTime())) {
        start = isoDate
      } else {
        start = parse(startDate.trim(), 'dd/MM/yyyy', new Date())
      }
    } else {
      start = new Date()
    }

    const daysToCreate = daysAhead || schedule.autoCreateDaysAhead || 90

    if (endDate) {
      const isoEndDate = new Date(endDate)
      if (!isNaN(isoEndDate.getTime())) {
        end = isoEndDate
      } else {
        end = parse(endDate.trim(), 'dd/MM/yyyy', new Date())
      }
    } else {
      end = addDays(start, daysToCreate)
    }

    // Parse do horário (HH:mm)
    const [hours, minutes] = schedule.time.split(':').map(Number)

    // Calcula todas as datas que correspondem ao dayOfWeek entre start e end
    const events: Array<{ title: string; startDate: Date; endDate: Date; time: string; location: string; description?: string; branchId: string }> = []

    let currentDate = new Date(start)
    const endDateTime = new Date(end)
    
    // Encontra o primeiro dia da semana que corresponde ao dayOfWeek
    // dayOfWeek: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    // JavaScript Date.getDay(): 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    // Ajusta para começar no primeiro dia da semana correto
    const currentDayOfWeek = currentDate.getDay()
    const daysUntilTarget = (schedule.dayOfWeek - currentDayOfWeek + 7) % 7
    if (daysUntilTarget > 0) {
      currentDate = addDays(currentDate, daysUntilTarget)
    }
    
    while (currentDate <= endDateTime) {
      // Cria a data com o horário específico
      const eventDate = setMinutes(setHours(startOfDay(new Date(currentDate)), hours), minutes)
      const eventEndDate = new Date(eventDate) // Mesmo dia e horário por padrão

        // Verifica se já existe um evento nessa data e horário
        const dayStart = startOfDay(new Date(currentDate))
        const dayEnd = addDays(dayStart, 1)
        
        const existingEvent = await prisma.event.findFirst({
          where: {
            branchId: schedule.branchId,
            startDate: {
              gte: dayStart,
              lt: dayEnd,
            },
            title: schedule.title,
          },
        })

        if (!existingEvent) {
          events.push({
            title: schedule.title,
            startDate: eventDate,
            endDate: eventEndDate,
            time: schedule.time,
            location: schedule.location ?? 'Não especificado',
            description: schedule.description,
            branchId: schedule.branchId,
          })
        }

      // Avança para a próxima semana (7 dias)
      currentDate = addDays(currentDate, 7)
    }

    // Cria os eventos em lote
    if (events.length > 0) {
      await prisma.event.createMany({
        data: events,
        skipDuplicates: true,
      })
    }

    return {
      created: events.length,
      schedule: schedule.title,
      period: {
        start: format(start, 'dd/MM/yyyy'),
        end: format(end, 'dd/MM/yyyy'),
      },
    }
  }
}


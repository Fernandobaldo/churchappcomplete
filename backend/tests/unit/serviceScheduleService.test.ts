import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServiceScheduleService } from '../../src/services/serviceScheduleService'
import { prisma } from '../../src/lib/prisma'

vi.mock('../../src/lib/prisma', () => {
  const mock = {
    serviceSchedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  }

  return { prisma: mock }
})

const service = new ServiceScheduleService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ServiceScheduleService', () => {
  const mockBranchId = 'branch-123'
  const mockScheduleData = {
    branchId: mockBranchId,
    dayOfWeek: 0, // Domingo
    time: '10:00',
    title: 'Culto Dominical',
    description: 'Culto de domingo',
    location: 'Templo Principal',
    isDefault: false,
    autoCreateEvents: false,
    autoCreateDaysAhead: 90,
  }

  describe('create', () => {
    it('deve criar um novo horário de culto', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        ...mockScheduleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.serviceSchedule.create as any).mockResolvedValue(mockSchedule)

      const result = await service.create(mockScheduleData)

      expect(prisma.serviceSchedule.create).toHaveBeenCalledWith({
        data: {
          branchId: mockScheduleData.branchId,
          dayOfWeek: mockScheduleData.dayOfWeek,
          time: mockScheduleData.time,
          title: mockScheduleData.title,
          description: mockScheduleData.description,
          location: mockScheduleData.location,
          isDefault: false,
          autoCreateEvents: false,
          autoCreateDaysAhead: 90,
        },
      })
      expect(result).toEqual(mockSchedule)
    })

    it('deve remover o padrão anterior quando criar um horário como padrão', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        ...mockScheduleData,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.serviceSchedule.updateMany as any).mockResolvedValue({ count: 1 })
      ;(prisma.serviceSchedule.create as any).mockResolvedValue(mockSchedule)

      const result = await service.create({ ...mockScheduleData, isDefault: true })

      expect(prisma.serviceSchedule.updateMany).toHaveBeenCalledWith({
        where: {
          branchId: mockBranchId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
      expect(prisma.serviceSchedule.create).toHaveBeenCalled()
      expect(result.isDefault).toBe(true)
    })
  })

  describe('getByBranchId', () => {
    it('deve retornar todos os horários de uma filial ordenados por dia e hora', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          branchId: mockBranchId,
          dayOfWeek: 0,
          time: '10:00',
          title: 'Culto Dominical',
        },
        {
          id: 'schedule-2',
          branchId: mockBranchId,
          dayOfWeek: 3,
          time: '19:00',
          title: 'Culto de Quarta',
        },
      ]

      ;(prisma.serviceSchedule.findMany as any).mockResolvedValue(mockSchedules)

      const result = await service.getByBranchId(mockBranchId)

      expect(prisma.serviceSchedule.findMany).toHaveBeenCalledWith({
        where: { branchId: mockBranchId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { time: 'asc' },
        ],
      })
      expect(result).toEqual(mockSchedules)
    })
  })

  describe('getById', () => {
    it('deve retornar um horário por ID com informações da filial', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        ...mockScheduleData,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue(mockSchedule)

      const result = await service.getById('schedule-123')

      expect(prisma.serviceSchedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'schedule-123' },
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
      expect(result).toEqual(mockSchedule)
    })
  })

  describe('update', () => {
    it('deve atualizar um horário existente e retornar old e updated', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        ...mockScheduleData,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      }

      const updateData = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
      }

      const updatedSchedule = {
        ...mockSchedule,
        ...updateData,
        updatedAt: new Date(),
      }

      ;(prisma.serviceSchedule.findUnique as any)
        .mockResolvedValueOnce(mockSchedule) // Para getById antes do update
        .mockResolvedValueOnce(mockSchedule) // Para getById dentro do update
      ;(prisma.serviceSchedule.update as any).mockResolvedValue(updatedSchedule)

      const result = await service.update('schedule-123', updateData)

      expect(prisma.serviceSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-123' },
        data: {
          branchId: undefined,
          dayOfWeek: undefined,
          time: '11:00',
          title: 'Culto Dominical Atualizado',
          description: undefined,
          location: undefined,
          isDefault: undefined,
          autoCreateEvents: undefined,
          autoCreateDaysAhead: undefined,
        },
      })
      expect(result).toHaveProperty('updated')
      expect(result).toHaveProperty('old')
      expect(result.updated).toEqual(updatedSchedule)
      expect(result.old).toEqual(mockSchedule)
    })

    it('deve remover o padrão anterior quando atualizar um horário como padrão', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        ...mockScheduleData,
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue(mockSchedule)
      ;(prisma.serviceSchedule.updateMany as any).mockResolvedValue({ count: 1 })
      ;(prisma.serviceSchedule.update as any).mockResolvedValue({
        ...mockSchedule,
        isDefault: true,
      })

      await service.update('schedule-123', { isDefault: true })

      expect(prisma.serviceSchedule.updateMany).toHaveBeenCalledWith({
        where: {
          branchId: mockBranchId,
          isDefault: true,
          id: { not: 'schedule-123' },
        },
        data: {
          isDefault: false,
        },
      })
    })
  })

  describe('delete', () => {
    it('deve deletar um horário', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        ...mockScheduleData,
      }

      ;(prisma.serviceSchedule.delete as any).mockResolvedValue(mockSchedule)

      const result = await service.delete('schedule-123')

      expect(prisma.serviceSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-123' },
      })
      expect(result).toEqual(mockSchedule)
    })
  })

  describe('setAsDefault', () => {
    it('deve definir um horário como padrão e remover o padrão anterior', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        isDefault: true,
      }

      // Mock getById para retornar o schedule com branchId
      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue({
        id: 'schedule-123',
        branchId: mockBranchId,
      })
      ;(prisma.serviceSchedule.updateMany as any).mockResolvedValue({ count: 1 })
      ;(prisma.serviceSchedule.update as any).mockResolvedValue(mockSchedule)

      const result = await service.setAsDefault('schedule-123', mockBranchId)

      expect(prisma.serviceSchedule.updateMany).toHaveBeenCalledWith({
        where: {
          branchId: mockBranchId,
          isDefault: true,
          id: { not: 'schedule-123' },
        },
        data: {
          isDefault: false,
        },
      })
      expect(prisma.serviceSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-123' },
        data: {
          isDefault: true,
        },
      })
      expect(result).toEqual(mockSchedule)
    })
  })

  describe('countRelatedEvents', () => {
    it('deve contar eventos relacionados a um horário de culto', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        title: 'Culto Dominical',
        time: '10:00',
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue({
        ...mockSchedule,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      })
      ;(prisma.event.count as any).mockResolvedValue(5)

      const count = await service.countRelatedEvents('schedule-123')

      expect(prisma.serviceSchedule.findUnique).toHaveBeenCalled()
      expect(prisma.event.count).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
      })
      expect(count).toBe(5)
    })

    it('deve retornar 0 quando não há eventos relacionados', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        title: 'Culto Dominical',
        time: '10:00',
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue({
        ...mockSchedule,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      })
      ;(prisma.event.count as any).mockResolvedValue(0)

      const count = await service.countRelatedEvents('schedule-123')

      expect(count).toBe(0)
    })

    it('deve lançar erro quando horário não é encontrado', async () => {
      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue(null)

      await expect(service.countRelatedEvents('schedule-123')).rejects.toThrow('Horário não encontrado')
    })
  })

  describe('deleteRelatedEvents', () => {
    it('deve deletar eventos relacionados a um horário de culto', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        title: 'Culto Dominical',
        time: '10:00',
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue({
        ...mockSchedule,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      })
      ;(prisma.event.deleteMany as any).mockResolvedValue({ count: 3 })

      const deletedCount = await service.deleteRelatedEvents('schedule-123')

      expect(prisma.serviceSchedule.findUnique).toHaveBeenCalled()
      expect(prisma.event.deleteMany).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
      })
      expect(deletedCount).toBe(3)
    })

    it('deve retornar 0 quando não há eventos para deletar', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        branchId: mockBranchId,
        title: 'Culto Dominical',
        time: '10:00',
      }

      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue({
        ...mockSchedule,
        Branch: {
          id: mockBranchId,
          name: 'Sede',
          churchId: 'church-123',
        },
      })
      ;(prisma.event.deleteMany as any).mockResolvedValue({ count: 0 })

      const deletedCount = await service.deleteRelatedEvents('schedule-123')

      expect(deletedCount).toBe(0)
    })

    it('deve lançar erro quando horário não é encontrado', async () => {
      ;(prisma.serviceSchedule.findUnique as any).mockResolvedValue(null)

      await expect(service.deleteRelatedEvents('schedule-123')).rejects.toThrow('Horário não encontrado')
    })
  })

  describe('updateRelatedEvents', () => {
    it('deve atualizar eventos relacionados quando schedule é editado', async () => {
      const oldSchedule = {
        title: 'Culto Dominical',
        time: '10:00',
        branchId: mockBranchId,
      }

      const newSchedule = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: 'Nova descrição',
        location: 'Novo local',
      }

      const mockEvents = [
        { id: 'event-1', title: 'Culto Dominical', time: '10:00', branchId: mockBranchId },
        { id: 'event-2', title: 'Culto Dominical', time: '10:00', branchId: mockBranchId },
        { id: 'event-3', title: 'Culto Dominical', time: '10:00', branchId: mockBranchId },
      ]

      ;(prisma.event.findMany as any).mockResolvedValue(mockEvents)
      ;(prisma.event.updateMany as any).mockResolvedValue({ count: 3 })

      const updatedCount = await service.updateRelatedEvents(oldSchedule, newSchedule)

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
      })

      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
        data: {
          title: 'Culto Dominical Atualizado',
          time: '11:00',
          description: 'Nova descrição', // updateMany aceita valores diretamente
          location: 'Novo local', // updateMany aceita valores diretamente
        },
      })

      expect(updatedCount).toBe(3)
    })

    it('deve retornar 0 quando não há eventos relacionados', async () => {
      const oldSchedule = {
        title: 'Culto Dominical',
        time: '10:00',
        branchId: mockBranchId,
      }

      const newSchedule = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: 'Nova descrição',
        location: 'Novo local',
      }

      ;(prisma.event.findMany as any).mockResolvedValue([])
      ;(prisma.event.updateMany as any).mockResolvedValue({ count: 0 })

      const updatedCount = await service.updateRelatedEvents(oldSchedule, newSchedule)

      expect(updatedCount).toBe(0)
      expect(prisma.event.updateMany).not.toHaveBeenCalled()
    })

    it('deve atualizar apenas campos fornecidos no newSchedule', async () => {
      const oldSchedule = {
        title: 'Culto Dominical',
        time: '10:00',
        branchId: mockBranchId,
      }

      const newSchedule = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        // description e location não fornecidos (undefined)
      }

      const mockEvents = [{ id: 'event-1', title: 'Culto Dominical', time: '10:00', branchId: mockBranchId }]

      ;(prisma.event.findMany as any).mockResolvedValue(mockEvents)
      ;(prisma.event.updateMany as any).mockResolvedValue({ count: 1 })

      await service.updateRelatedEvents(oldSchedule, newSchedule)

      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
        data: {
          title: 'Culto Dominical Atualizado',
          time: '11:00',
        },
      })
    })

    it('deve atualizar description e location quando fornecidos como null', async () => {
      const oldSchedule = {
        title: 'Culto Dominical',
        time: '10:00',
        branchId: mockBranchId,
      }

      const newSchedule = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: null,
        location: null,
      }

      const mockEvents = [{ id: 'event-1', title: 'Culto Dominical', time: '10:00', branchId: mockBranchId }]

      ;(prisma.event.findMany as any).mockResolvedValue(mockEvents)
      ;(prisma.event.updateMany as any).mockResolvedValue({ count: 1 })

      await service.updateRelatedEvents(oldSchedule, newSchedule)

      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: mockBranchId,
        },
        data: {
          title: 'Culto Dominical Atualizado',
          time: '11:00',
          description: null, // updateMany aceita null diretamente
          location: null, // updateMany aceita null diretamente
        },
      })
    })
  })
})


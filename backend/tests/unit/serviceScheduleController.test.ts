import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServiceScheduleController } from '../../src/controllers/serviceScheduleController'
import { ServiceScheduleService } from '../../src/services/serviceScheduleService'
import { FastifyRequest, FastifyReply } from 'fastify'
import { logAudit } from '../../src/utils/auditHelper'
import { getMemberFromUserId } from '../../src/utils/authorization'

// Mock do ServiceScheduleService - precisa mockar a classe inteira
vi.mock('../../src/services/serviceScheduleService', () => {
  const mockService = {
    getById: vi.fn(),
    countRelatedEvents: vi.fn(),
    deleteRelatedEvents: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    updateRelatedEvents: vi.fn(),
    createEventsFromSchedule: vi.fn(),
  }
  return {
    ServiceScheduleService: vi.fn(() => mockService),
  }
})

vi.mock('../../src/utils/auditHelper', () => ({
  logAudit: vi.fn(),
}))

vi.mock('../../src/utils/authorization', () => ({
  getMemberFromUserId: vi.fn(),
}))

describe('ServiceScheduleController', () => {
  let controller: ServiceScheduleController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new ServiceScheduleController()
    vi.clearAllMocks()

    // Usar CUIDs válidos para passar na validação do Zod
    const validCuid = 'clx123456789012345678901234'
    const validBranchCuid = 'clx987654321098765432109876'
    const validUserCuid = 'clx111111111111111111111111'

    mockRequest = {
      user: {
        userId: validUserCuid,
        id: validUserCuid,
        branchId: validBranchCuid,
        role: 'ADMINFILIAL',
        permissions: ['church_manage'],
      },
      params: { id: validCuid },
      body: {},
    }

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
  })

  describe('getRelatedEventsCount', () => {
    it('deve retornar a contagem de eventos relacionados', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const mockSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
        time: '10:00',
      }

      // Acessa a instância mockada do service através do controller
      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      serviceInstance.countRelatedEvents = vi.fn().mockResolvedValue(5)

      await controller.getRelatedEventsCount(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        count: 5,
        scheduleTitle: 'Culto Dominical',
      })
    })

    it('deve retornar 404 quando horário não é encontrado', async () => {
      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(null)

      await controller.getRelatedEventsCount(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário não encontrado.',
      })
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      const validCuid = 'clx123456789012345678901234'
      const differentBranchCuid = 'clx999999999999999999999999'
      
      const mockSchedule = {
        id: validCuid,
        branchId: differentBranchCuid, // Diferente do branchId do usuário
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      ;(getMemberFromUserId as any) = vi.fn().mockResolvedValue({
        id: 'member-123',
        role: 'MEMBER', // Não é ADMINGERAL
      })

      await controller.getRelatedEventsCount(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(403)
    })
  })

  describe('delete', () => {
    it('deve deletar um horário sem deletar eventos quando deleteEvents é false', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const mockSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      serviceInstance.countRelatedEvents = vi.fn().mockResolvedValue(3)
      serviceInstance.delete = vi.fn().mockResolvedValue(mockSchedule)
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = { deleteEvents: false }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.deleteRelatedEvents).not.toHaveBeenCalled()
      expect(serviceInstance.delete).toHaveBeenCalledWith(validCuid)
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário deletado com sucesso.',
        deletedEventsCount: 0,
        relatedEventsCount: 3,
      })
    })

    it('deve deletar um horário e eventos relacionados quando deleteEvents é true', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const mockSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      serviceInstance.countRelatedEvents = vi.fn().mockResolvedValue(3)
      serviceInstance.deleteRelatedEvents = vi.fn().mockResolvedValue(3)
      serviceInstance.delete = vi.fn().mockResolvedValue(mockSchedule)
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = { deleteEvents: true }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.deleteRelatedEvents).toHaveBeenCalledWith(validCuid)
      expect(serviceInstance.delete).toHaveBeenCalledWith(validCuid)
      expect(logAudit).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário deletado com sucesso.',
        deletedEventsCount: 3,
        relatedEventsCount: 3,
      })
    })

    it('deve retornar 404 quando horário não é encontrado', async () => {
      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(null)

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário não encontrado.',
      })
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      const validCuid = 'clx123456789012345678901234'
      const differentBranchCuid = 'clx999999999999999999999999'
      
      const mockSchedule = {
        id: validCuid,
        branchId: differentBranchCuid, // Diferente do branchId do usuário
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      ;(getMemberFromUserId as any) = vi.fn().mockResolvedValue({
        id: 'member-123',
        role: 'MEMBER', // Não é ADMINGERAL
      })

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(403)
    })

    it('deve usar deleteEvents false como padrão quando não fornecido', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const mockSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      serviceInstance.countRelatedEvents = vi.fn().mockResolvedValue(2)
      serviceInstance.delete = vi.fn().mockResolvedValue(mockSchedule)
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = {} // Sem deleteEvents

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.deleteRelatedEvents).not.toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário deletado com sucesso.',
        deletedEventsCount: 0,
        relatedEventsCount: 2,
      })
    })
  })

  describe('update', () => {
    it('deve atualizar um horário e atualizar eventos relacionados quando há mudanças relevantes', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const oldSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
        time: '10:00',
        description: 'Descrição antiga',
        location: 'Local antigo',
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const updatedSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: 'Nova descrição',
        location: 'Novo local',
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const updateData = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: 'Nova descrição',
        location: 'Novo local',
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(oldSchedule)
      serviceInstance.update = vi.fn().mockResolvedValue({
        updated: updatedSchedule,
        old: oldSchedule,
      })
      serviceInstance.updateRelatedEvents = vi.fn().mockResolvedValue(5)
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = updateData

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.update).toHaveBeenCalledWith(validCuid, updateData)
      expect(serviceInstance.updateRelatedEvents).toHaveBeenCalledWith(
        {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: validBranchCuid,
        },
        {
          title: 'Culto Dominical Atualizado',
          time: '11:00',
          description: 'Nova descrição',
          location: 'Novo local',
        }
      )
      expect(logAudit).toHaveBeenCalledTimes(2) // Uma para eventos atualizados, outra para o schedule
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedSchedule,
          updatedEventsCount: 5,
        })
      )
    })

    it('deve atualizar um horário sem atualizar eventos quando não há mudanças relevantes', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const oldSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
        time: '10:00',
        description: 'Descrição',
        location: 'Local',
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const updatedSchedule = {
        ...oldSchedule,
        isDefault: true, // Apenas isDefault mudou
      }

      const updateData = {
        isDefault: true,
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(oldSchedule)
      serviceInstance.update = vi.fn().mockResolvedValue({
        updated: updatedSchedule,
        old: oldSchedule,
      })
      serviceInstance.updateRelatedEvents = vi.fn()
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = updateData

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.update).toHaveBeenCalledWith(validCuid, updateData)
      expect(serviceInstance.updateRelatedEvents).not.toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedSchedule,
          updatedEventsCount: 0,
        })
      )
    })

    it('deve criar eventos automaticamente quando autoCreateEvents é ativado', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const oldSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
        time: '10:00',
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const updatedSchedule = {
        ...oldSchedule,
        autoCreateEvents: true,
        autoCreateDaysAhead: 120,
      }

      const updateData = {
        autoCreateEvents: true,
        autoCreateDaysAhead: 120,
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(oldSchedule)
      serviceInstance.update = vi.fn().mockResolvedValue({
        updated: updatedSchedule,
        old: oldSchedule,
      })
      serviceInstance.updateRelatedEvents = vi.fn().mockResolvedValue(0)
      serviceInstance.createEventsFromSchedule = vi.fn().mockResolvedValue({
        created: 10,
        schedule: 'Culto Dominical',
        period: { start: '01/01/2024', end: '30/04/2024' },
      })
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = updateData

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(serviceInstance.createEventsFromSchedule).toHaveBeenCalledWith(
        validCuid,
        undefined,
        undefined,
        120
      )
    })

    it('deve retornar 404 quando horário não é encontrado', async () => {
      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(null)

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Horário não encontrado.',
      })
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      const validCuid = 'clx123456789012345678901234'
      const differentBranchCuid = 'clx999999999999999999999999'
      
      const mockSchedule = {
        id: validCuid,
        branchId: differentBranchCuid,
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(mockSchedule)
      ;(getMemberFromUserId as any) = vi.fn().mockResolvedValue({
        id: 'member-123',
        role: 'MEMBER',
      })

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(403)
    })

    it('deve tratar erros ao atualizar eventos relacionados sem falhar a atualização do schedule', async () => {
      const validCuid = 'clx123456789012345678901234'
      const validBranchCuid = 'clx987654321098765432109876'
      
      const oldSchedule = {
        id: validCuid,
        branchId: validBranchCuid,
        title: 'Culto Dominical',
        time: '10:00',
        description: 'Descrição antiga',
        location: 'Local antigo',
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const updatedSchedule = {
        ...oldSchedule,
        title: 'Culto Dominical Atualizado',
        time: '11:00',
      }

      const updateData = {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
      }

      const serviceInstance = (controller as any).service
      serviceInstance.getById = vi.fn().mockResolvedValue(oldSchedule)
      serviceInstance.update = vi.fn().mockResolvedValue({
        updated: updatedSchedule,
        old: oldSchedule,
      })
      serviceInstance.updateRelatedEvents = vi.fn().mockRejectedValue(new Error('Erro ao atualizar eventos'))
      ;(logAudit as any) = vi.fn().mockResolvedValue(undefined)

      mockRequest.body = updateData

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      // A atualização do schedule deve ter sucesso mesmo com erro ao atualizar eventos
      expect(serviceInstance.update).toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedSchedule,
          updatedEventsCount: 0,
        })
      )
    })
  })
})


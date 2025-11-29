import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { ServiceScheduleService } from '../../src/services/serviceScheduleService'

describe('ServiceSchedule - Integration Tests', () => {
  let service: ServiceScheduleService
  let testBranchId: string
  let testChurchId: string
  let testUserId: string

  beforeAll(async () => {
    service = new ServiceScheduleService()

    // Criar dados de teste
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'hashed_password',
      },
    })
    testUserId = testUser.id

    const testChurch = await prisma.church.create({
      data: {
        name: 'Test Church',
        isActive: true,
      },
    })
    testChurchId = testChurch.id

    const testBranch = await prisma.branch.create({
      data: {
        name: 'Test Branch',
        churchId: testChurchId,
        isMainBranch: true,
      },
    })
    testBranchId = testBranch.id
  })

  afterAll(async () => {
    // Limpar dados de teste (ordem importante devido a foreign keys)
    await prisma.event.deleteMany({
      where: { branchId: testBranchId },
    })
    await prisma.serviceSchedule.deleteMany({
      where: { branchId: testBranchId },
    })
    await prisma.branch.deleteMany({
      where: { churchId: testChurchId },
    })
    await prisma.church.deleteMany({
      where: { id: testChurchId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
  })

  beforeEach(async () => {
    // Limpar horários e eventos antes de cada teste
    await prisma.event.deleteMany({
      where: { branchId: testBranchId },
    })
    await prisma.serviceSchedule.deleteMany({
      where: { branchId: testBranchId },
    })
  })

  describe('CRUD Operations', () => {
    it('deve criar um horário de culto', async () => {
      const scheduleData = {
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        description: 'Culto de domingo',
        location: 'Templo Principal',
        isDefault: false,
        autoCreateEvents: false,
        autoCreateDaysAhead: 90,
      }

      const schedule = await service.create(scheduleData)

      expect(schedule).toMatchObject({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        isDefault: false,
        autoCreateEvents: false,
      })
      expect(schedule.id).toBeDefined()
    })

    it('deve listar horários de uma filial', async () => {
      // Criar múltiplos horários
      await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      await service.create({
        branchId: testBranchId,
        dayOfWeek: 3,
        time: '19:00',
        title: 'Culto de Quarta',
      })

      const schedules = await service.getByBranchId(testBranchId)

      expect(schedules).toHaveLength(2)
      expect(schedules[0].dayOfWeek).toBeLessThanOrEqual(schedules[1].dayOfWeek)
    })

    it('deve atualizar um horário', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      const result = await service.update(schedule.id, {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
      })

      expect(result.updated.title).toBe('Culto Dominical Atualizado')
      expect(result.updated.time).toBe('11:00')
      expect(result.old).toBeDefined()
    })

    it('deve deletar um horário', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      await service.delete(schedule.id)

      const found = await service.getById(schedule.id)
      expect(found).toBeNull()
    })

    it('deve definir um horário como padrão e remover o padrão anterior', async () => {
      const schedule1 = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        isDefault: true,
      })

      const schedule2 = await service.create({
        branchId: testBranchId,
        dayOfWeek: 3,
        time: '19:00',
        title: 'Culto de Quarta',
      })

      await service.setAsDefault(schedule2.id, testBranchId)

      const updated1 = await service.getById(schedule1.id)
      const updated2 = await service.getById(schedule2.id)

      expect(updated1?.isDefault).toBe(false)
      expect(updated2?.isDefault).toBe(true)
    })
  })

  describe('Deleção em Cascata de Eventos', () => {
    beforeEach(async () => {
      // Limpar eventos antes de cada teste
      await prisma.event.deleteMany({
        where: { branchId: testBranchId },
      })
    })

    it('deve contar eventos relacionados a um horário de culto', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      // Criar eventos relacionados
      await prisma.event.createMany({
        data: [
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-07T10:00:00'),
            endDate: new Date('2024-01-07T10:00:00'),
          },
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-14T10:00:00'),
            endDate: new Date('2024-01-14T10:00:00'),
          },
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-21T10:00:00'),
            endDate: new Date('2024-01-21T10:00:00'),
          },
        ],
      })

      // Criar um evento não relacionado (título diferente)
      await prisma.event.create({
        data: {
          title: 'Outro Evento',
          time: '10:00',
          branchId: testBranchId,
          location: 'Templo Principal',
          startDate: new Date('2024-01-07T10:00:00'),
          endDate: new Date('2024-01-07T10:00:00'),
        },
      })

      const count = await service.countRelatedEvents(schedule.id)

      expect(count).toBe(3)
    })

    it('deve deletar eventos relacionados quando deletar um horário', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      // Criar eventos relacionados
      const relatedEvents = await prisma.event.createMany({
        data: [
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-07T10:00:00'),
            endDate: new Date('2024-01-07T10:00:00'),
          },
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-14T10:00:00'),
            endDate: new Date('2024-01-14T10:00:00'),
          },
        ],
      })

      // Criar um evento não relacionado
      const unrelatedEvent = await prisma.event.create({
        data: {
          title: 'Outro Evento',
          time: '10:00',
          branchId: testBranchId,
          location: 'Templo Principal',
          startDate: new Date('2024-01-07T10:00:00'),
          endDate: new Date('2024-01-07T10:00:00'),
        },
      })

      const deletedCount = await service.deleteRelatedEvents(schedule.id)

      expect(deletedCount).toBe(2)

      // Verificar que os eventos relacionados foram deletados
      const remainingRelatedEvents = await prisma.event.count({
        where: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: testBranchId,
        },
      })
      expect(remainingRelatedEvents).toBe(0)

      // Verificar que o evento não relacionado ainda existe
      const unrelatedStillExists = await prisma.event.findUnique({
        where: { id: unrelatedEvent.id },
      })
      expect(unrelatedStillExists).not.toBeNull()
    })

    it('deve retornar 0 quando não há eventos relacionados', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      const count = await service.countRelatedEvents(schedule.id)
      expect(count).toBe(0)

      const deletedCount = await service.deleteRelatedEvents(schedule.id)
      expect(deletedCount).toBe(0)
    })

    it('não deve deletar eventos com título, horário ou branchId diferentes', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      // Criar eventos com diferentes critérios
      await prisma.event.createMany({
        data: [
          {
            // Mesmo título e branchId, mas horário diferente
            title: 'Culto Dominical',
            time: '11:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-07T11:00:00'),
            endDate: new Date('2024-01-07T11:00:00'),
          },
          {
            // Mesmo horário e branchId, mas título diferente
            title: 'Culto de Quarta',
            time: '10:00',
            branchId: testBranchId,
            location: 'Templo Principal',
            startDate: new Date('2024-01-10T10:00:00'),
            endDate: new Date('2024-01-10T10:00:00'),
          },
        ],
      })

      const deletedCount = await service.deleteRelatedEvents(schedule.id)

      expect(deletedCount).toBe(0)

      // Verificar que os eventos ainda existem
      const remainingEvents = await prisma.event.count({
        where: { branchId: testBranchId },
      })
      expect(remainingEvents).toBe(2)
    })
  })

  describe('updateRelatedEvents', () => {
    it('deve atualizar eventos relacionados quando um horário é editado', async () => {
      // Criar um horário de culto
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        description: 'Descrição antiga',
        location: 'Local antigo',
      })

      // Criar eventos relacionados
      const relatedEvents = await prisma.event.createMany({
        data: [
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Local antigo',
            description: 'Descrição antiga',
            startDate: new Date('2024-01-07T10:00:00'),
            endDate: new Date('2024-01-07T10:00:00'),
          },
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Local antigo',
            description: 'Descrição antiga',
            startDate: new Date('2024-01-14T10:00:00'),
            endDate: new Date('2024-01-14T10:00:00'),
          },
          {
            title: 'Culto Dominical',
            time: '10:00',
            branchId: testBranchId,
            location: 'Local antigo',
            description: 'Descrição antiga',
            startDate: new Date('2024-01-21T10:00:00'),
            endDate: new Date('2024-01-21T10:00:00'),
          },
        ],
      })

      // Criar um evento não relacionado
      const unrelatedEvent = await prisma.event.create({
        data: {
          title: 'Outro Evento',
          time: '10:00',
          branchId: testBranchId,
          location: 'Local antigo',
          startDate: new Date('2024-01-07T10:00:00'),
          endDate: new Date('2024-01-07T10:00:00'),
        },
      })

      // Atualizar o horário
      const { updated, old } = await service.update(schedule.id, {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: 'Nova descrição',
        location: 'Novo local',
      })

      // Atualizar eventos relacionados
      const updatedCount = await service.updateRelatedEvents(
        {
          title: old.title,
          time: old.time,
          branchId: old.branchId,
        },
        {
          title: updated.title,
          time: updated.time,
          description: updated.description,
          location: updated.location,
        }
      )

      expect(updatedCount).toBe(3)

      // Verificar que os eventos relacionados foram atualizados
      const updatedEvents = await prisma.event.findMany({
        where: {
          title: 'Culto Dominical Atualizado',
          time: '11:00',
          branchId: testBranchId,
        },
      })

      expect(updatedEvents).toHaveLength(3)
      updatedEvents.forEach((event) => {
        expect(event.title).toBe('Culto Dominical Atualizado')
        expect(event.time).toBe('11:00')
        expect(event.description).toBe('Nova descrição')
        expect(event.location).toBe('Novo local')
      })

      // Verificar que o evento não relacionado não foi alterado
      const unrelatedStillExists = await prisma.event.findUnique({
        where: { id: unrelatedEvent.id },
      })
      expect(unrelatedStillExists).not.toBeNull()
      expect(unrelatedStillExists?.title).toBe('Outro Evento')
    })

    it('deve retornar 0 quando não há eventos relacionados para atualizar', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
      })

      const { updated, old } = await service.update(schedule.id, {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
      })

      const updatedCount = await service.updateRelatedEvents(
        {
          title: old.title,
          time: old.time,
          branchId: old.branchId,
        },
        {
          title: updated.title,
          time: updated.time,
        }
      )

      expect(updatedCount).toBe(0)
    })

    it('deve atualizar apenas campos fornecidos no newSchedule', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        description: 'Descrição original',
        location: 'Local original',
      })

      // Criar um evento relacionado
      const relatedEvent = await prisma.event.create({
        data: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: testBranchId,
          location: 'Local original',
          description: 'Descrição original',
          startDate: new Date('2024-01-07T10:00:00'),
          endDate: new Date('2024-01-07T10:00:00'),
        },
      })

      const { updated, old } = await service.update(schedule.id, {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        // description e location não fornecidos
      })

      const updatedCount = await service.updateRelatedEvents(
        {
          title: old.title,
          time: old.time,
          branchId: old.branchId,
        },
        {
          title: updated.title,
          time: updated.time,
          // description e location não fornecidos (undefined)
        }
      )

      expect(updatedCount).toBe(1)

      // Verificar que apenas title e time foram atualizados
      const updatedEvent = await prisma.event.findUnique({
        where: { id: relatedEvent.id },
      })

      expect(updatedEvent?.title).toBe('Culto Dominical Atualizado')
      expect(updatedEvent?.time).toBe('11:00')
      // description e location devem permanecer inalterados
      expect(updatedEvent?.description).toBe('Descrição original')
      expect(updatedEvent?.location).toBe('Local original')
    })

    it('deve atualizar description quando fornecido como null, mas location não pode ser null', async () => {
      const schedule = await service.create({
        branchId: testBranchId,
        dayOfWeek: 0,
        time: '10:00',
        title: 'Culto Dominical',
        description: 'Descrição original',
        location: 'Local original',
      })

      // Criar um evento relacionado
      const relatedEvent = await prisma.event.create({
        data: {
          title: 'Culto Dominical',
          time: '10:00',
          branchId: testBranchId,
          location: 'Local original',
          description: 'Descrição original',
          startDate: new Date('2024-01-07T10:00:00'),
          endDate: new Date('2024-01-07T10:00:00'),
        },
      })

      const { updated, old } = await service.update(schedule.id, {
        title: 'Culto Dominical Atualizado',
        time: '11:00',
        description: null,
        location: 'Novo local', // Location não pode ser null
      })

      const updatedCount = await service.updateRelatedEvents(
        {
          title: old.title,
          time: old.time,
          branchId: old.branchId,
        },
        {
          title: updated.title,
          time: updated.time,
          description: updated.description,
          location: updated.location,
        }
      )

      expect(updatedCount).toBe(1)

      // Verificar que description foi atualizado para null e location foi atualizado
      const updatedEvent = await prisma.event.findUnique({
        where: { id: relatedEvent.id },
      })

      expect(updatedEvent?.title).toBe('Culto Dominical Atualizado')
      expect(updatedEvent?.time).toBe('11:00')
      expect(updatedEvent?.description).toBeNull()
      expect(updatedEvent?.location).toBe('Novo local')
    })
  })
})


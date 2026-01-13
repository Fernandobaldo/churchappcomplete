// tests/e2e/permissions-by-action.test.ts
// E2E test para Permissões por Ação
// Padrão: Validar fluxo completo de permissões e ações
// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

// Importa o setup do ambiente de teste
import '../setupTestEnv'

import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { createTestApp } from '../utils/createTestApp'
import { createTestPlan } from '../utils/testFactories'
import {
  registerUser,
  loginUser,
  createChurch,
  createEvent,
  createContribution,
  createTransaction,
  setupCompleteUser,
  assignPermission,
  updateMemberRole,
  createDevotional,
  createMember,
  createServiceSchedule,
  getResourceById,
} from './helpers/testHelpers'
import { format } from 'date-fns'
import request from 'supertest'

describe('E2E: Permissões por Ação', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeAll(async () => {
    // Given - Setup do ambiente de teste
    app = await createTestApp()
    await resetTestDatabase()

    // Cria o plano gratuito (necessário para registro de usuários)
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: 'free' },
          { name: 'Free' },
          { name: 'Free Plan' },
        ],
      },
    })

    if (!existingPlan) {
      await createTestPlan({
        name: 'free',
        price: 0,
        features: [
          'Até 1 igreja',
          'Até 1 filial',
          'Até 20 membros',
          'Painel de controle limitado',
        ],
        maxBranches: 1,
        maxMembers: 20,
      })
      console.log('[E2E Permissions] ✅ Plano Free criado')
    } else {
      console.log(`[E2E Permissions] ℹ️ Plano Free já existe`)
    }
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Cenário: Membro realiza ação após receber permissão', () => {
    it('deve permitir criar devocional após receber devotional_manage', async () => {
      // Given - Estado inicial: admin geral e membro criados
      const timestamp = Date.now()
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      expect(memberResult.id).toBeDefined()
      const memberId = memberResult.id

      // When - Admin concede permissão e membro cria devocional
      await assignPermission(app, adminResult.token, memberId, 'devotional_manage')
      const memberLogin = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      const devotional = await createDevotional(app, memberLogin.token, {
        title: 'Devocional de Teste',
        passage: 'João 3:16',
        content: 'Conteúdo do devocional de teste',
      })

      // Then - Validação de criação de devocional
      expect(devotional.id).toBeDefined()
      expect(devotional.title).toBe('Devocional de Teste')

      // Then - Verificação de estado final no banco
      const devotionalDetails = await getResourceById(app, memberLogin.token, 'devotionals', devotional.id)
      expect(devotionalDetails.id).toBe(devotional.id)
      expect(devotionalDetails.title).toBe('Devocional de Teste')
    })

    it('deve permitir criar evento após receber events_manage', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin atualiza role do membro para COORDINATOR (necessário para criar eventos)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 4. Admin concede permissão events_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'events_manage')

      // 5. Membro faz login
      const memberLogin = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 6. Membro cria evento
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const event = await createEvent(app, memberLogin.token, {
        title: 'Evento de Teste',
        startDate: format(tomorrow, 'dd-MM-yyyy'),
        endDate: format(tomorrow, 'dd-MM-yyyy'),
        time: '19:00',
        location: 'Igreja',
        description: 'Descrição do evento de teste',
      })

      expect(event.id).toBeDefined()
      expect(event.title).toBe('Evento de Teste')

      // 7. Validar que o evento foi criado
      const eventDetails = await getResourceById(app, memberLogin.token, 'events', event.id)
      expect(eventDetails.id).toBe(event.id)
      expect(eventDetails.title).toBe('Evento de Teste')
    })

    it('deve permitir criar contribuição após receber contributions_manage', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin atualiza role do membro para COORDINATOR (necessário para receber contributions_manage)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 4. Admin concede permissão contributions_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'contributions_manage')

      // 5. Membro faz login
      const memberLogin = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 6. Membro cria campanha de contribuição
      const contribution = await createContribution(app, memberLogin.token, {
        title: 'Campanha de Teste',
        description: 'Descrição da campanha',
        goal: 10000.50,
        isActive: true,
        paymentMethods: [
          {
            type: 'PIX',
            data: { chave: '12345678900' },
          },
        ],
      })

      expect(contribution.id).toBeDefined()
      expect(contribution.title).toBe('Campanha de Teste')
      expect(contribution.goal).toBe(10000.50)

      // 7. Validar que a campanha foi criada
      const contributionDetails = await getResourceById(app, memberLogin.token, 'contributions', contribution.id)
      expect(contributionDetails.id).toBe(contribution.id)
      expect(contributionDetails.title).toBe('Campanha de Teste')
    })

    it('deve permitir criar membro após receber members_manage', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin atualiza role do membro para COORDINATOR (necessário para criar membros)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 4. Admin concede permissão members_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'members_manage')

      // 5. Membro faz login
      const memberLogin = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 6. Membro cria outro membro
      const newMember = await createMember(app, memberLogin.token, {
        name: `Novo Membro ${timestamp}`,
        email: `novo-membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      expect(newMember.id).toBeDefined()
      expect(newMember.name).toBe(`Novo Membro ${timestamp}`)

      // 7. Validar que o membro foi criado
      const memberDetails = await getResourceById(app, memberLogin.token, 'members', newMember.id)
      expect(memberDetails.id).toBe(newMember.id)
      expect(memberDetails.name).toBe(`Novo Membro ${timestamp}`)
    })

    it('deve permitir visualizar membros após receber members_view', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin concede permissão members_view
      await assignPermission(app, adminResult.token, memberId, 'members_view')

      // 4. Membro faz login
      const memberLogin = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 5. Membro lista membros (GET /members retorna array)
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${memberLogin.token}`)
      
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('deve rejeitar finances_manage para MEMBER sem role adequado', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin tenta conceder permissão finances_manage a MEMBER (deve falhar)
      try {
        await assignPermission(app, adminResult.token, memberId, 'finances_manage')
        // Se chegou aqui, o teste falhou
        expect.fail('Deveria ter retornado erro 403 ao tentar conceder finances_manage a MEMBER')
      } catch (error: any) {
        // Espera erro 403 (Forbidden) - validação impede concessão de finances_manage a MEMBER
        expect(error.message).toContain('403')
        expect(error.message).toContain('Membros com role MEMBER não podem receber as permissões: finances_manage')
      }

      // 4. Admin atualiza role do membro para COORDINATOR (necessário para receber finances_manage)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 5. Admin concede permissão finances_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'finances_manage')

      // 6. Membro faz login para obter token com role COORDINATOR e permissão finances_manage
      const memberLoginUpdated = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 7. Agora o membro deve conseguir criar transação (tem role COORDINATOR e permissão)
      const transaction = await createTransaction(app, memberLoginUpdated.token, {
        title: 'Transação de Teste',
        amount: 100.50,
        type: 'ENTRY',
        entryType: 'OFERTA',
      })

      expect(transaction.id).toBeDefined()
      expect(transaction.title).toBe('Transação de Teste')

      // 8. Validar que a transação foi criada
      const transactionDetails = await getResourceById(app, memberLoginUpdated.token, 'finances', transaction.id)
      expect(transactionDetails.id).toBe(transaction.id)
      expect(transactionDetails.title).toBe('Transação de Teste')
    })

    it('deve rejeitar church_manage para MEMBER sem role adequado', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id
      const branchId = adminResult.branchId

      // 3. Admin tenta conceder permissão church_manage a MEMBER (deve falhar)
      try {
        await assignPermission(app, adminResult.token, memberId, 'church_manage')
        // Se chegou aqui, o teste falhou
        expect.fail('Deveria ter retornado erro 403 ao tentar conceder church_manage a MEMBER')
      } catch (error: any) {
        // Espera erro 403 (Forbidden) - validação impede concessão de church_manage a MEMBER
        expect(error.message).toContain('403')
        expect(error.message).toContain('Membros com role MEMBER não podem receber as permissões: church_manage')
      }

      // 4. Admin atualiza role do membro para COORDINATOR (necessário para receber church_manage)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 5. Admin concede permissão church_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'church_manage')

      // 6. Membro faz login para obter token com role COORDINATOR e permissão church_manage
      const memberLoginUpdated = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 7. Agora o membro deve conseguir criar horário de culto (tem role COORDINATOR e permissão)
      const schedule = await createServiceSchedule(app, memberLoginUpdated.token, {
        title: 'Culto Dominical',
        time: '19:00',
        dayOfWeek: 0, // 0 = Domingo
        description: 'Culto de domingo',
        location: 'Igreja',
        branchId: branchId!,
      })

      expect(schedule.id).toBeDefined()
      expect(schedule.title).toBe('Culto Dominical')

      // 8. Validar que o horário foi criado
      const scheduleDetails = await getResourceById(app, memberLoginUpdated.token, 'service-schedules', schedule.id)
      expect(scheduleDetails.id).toBe(schedule.id)
      expect(scheduleDetails.title).toBe('Culto Dominical')
    })

    it('deve rejeitar members_manage para MEMBER sem role adequado', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Admin tenta conceder permissão members_manage a MEMBER (deve falhar)
      try {
        await assignPermission(app, adminResult.token, memberId, 'members_manage')
        // Se chegou aqui, o teste falhou
        expect.fail('Deveria ter retornado erro 403 ao tentar conceder members_manage a MEMBER')
      } catch (error: any) {
        // Espera erro 403 (Forbidden) - validação impede concessão de members_manage a MEMBER
        expect(error.message).toContain('403')
        expect(error.message).toContain('Membros com role MEMBER não podem receber as permissões: members_manage')
      }

      // 4. Admin atualiza role do membro para COORDINATOR (necessário para receber members_manage)
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 5. Admin concede permissão members_manage (agora é permitido porque é COORDINATOR)
      await assignPermission(app, adminResult.token, memberId, 'members_manage')

      // 6. Membro faz login para obter token com role COORDINATOR e permissão members_manage
      const memberLoginUpdated = await loginUser(app, {
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
      })

      // 7. Agora o membro deve conseguir criar outro membro (tem role COORDINATOR e permissão)
      const newMember = await createMember(app, memberLoginUpdated.token, {
        name: `Novo Membro ${timestamp}`,
        email: `novo-membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      expect(newMember.id).toBeDefined()
      expect(newMember.name).toBe(`Novo Membro ${timestamp}`)

      // 8. Validar que o membro foi criado
      const memberDetails = await getResourceById(app, memberLoginUpdated.token, 'members', newMember.id)
      expect(memberDetails.id).toBe(newMember.id)
      expect(memberDetails.name).toBe(`Novo Membro ${timestamp}`)
    })

    it('deve manter permissões ativas ao fazer upgrade de role e remover ao fazer downgrade', async () => {
      const timestamp = Date.now()
      
      // 1. Criar admin geral
      const adminResult = await setupCompleteUser(app, {
        name: `Admin E2E ${timestamp}`,
        email: `admin-${timestamp}@test.com`,
        password: 'senha123456',
      }, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // 2. Criar membro com role MEMBER
      const memberResult = await createMember(app, adminResult.token, {
        name: `Membro E2E ${timestamp}`,
        email: `membro-${timestamp}@test.com`,
        password: 'senha123456',
        role: 'MEMBER',
        branchId: adminResult.branchId,
      })

      const memberId = memberResult.id

      // 3. Conceder permissões não restritas (devotional_manage, events_manage) - ambas de uma vez
      // Inclui members_view que sempre deve estar presente
      const response1 = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminResult.token}`)
        .send({ permissions: ['members_view', 'devotional_manage', 'events_manage'] })
      
      if (response1.status !== 200) {
        throw new Error(`Falha ao conceder permissões: ${response1.status} - ${JSON.stringify(response1.body)}`)
      }

      // 4. Verificar que membro tem as permissões
      const memberBefore = await getResourceById(app, adminResult.token, 'members', memberId)
      const permissionsBefore = (memberBefore.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.type)
      expect(permissionsBefore).toContain('devotional_manage')
      expect(permissionsBefore).toContain('events_manage')
      expect(permissionsBefore).toContain('members_view')

      // 5. Fazer upgrade para COORDINATOR
      await updateMemberRole(app, adminResult.token, memberId, 'COORDINATOR')

      // 6. Verificar que permissões não restritas foram mantidas
      const memberAfterUpgrade = await getResourceById(app, adminResult.token, 'members', memberId)
      const permissionsAfterUpgrade = (memberAfterUpgrade.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.type)
      expect(permissionsAfterUpgrade).toContain('devotional_manage')
      expect(permissionsAfterUpgrade).toContain('events_manage')
      expect(permissionsAfterUpgrade).toContain('members_view')

      // 7. Conceder permissões restritas (members_manage, finances_manage) - ambas de uma vez
      // Mantém as permissões não restritas já existentes
      const currentPerms = (memberAfterUpgrade.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.type)
      const response2 = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminResult.token}`)
        .send({ permissions: [...currentPerms, 'members_manage', 'finances_manage'] })
      
      if (response2.status !== 200) {
        throw new Error(`Falha ao conceder permissões: ${response2.status} - ${JSON.stringify(response2.body)}`)
      }

      // 8. Verificar que permissões restritas foram adicionadas
      const memberWithRestricted = await getResourceById(app, adminResult.token, 'members', memberId)
      const permissionsWithRestricted = (memberWithRestricted.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.type)
      expect(permissionsWithRestricted).toContain('members_manage')
      expect(permissionsWithRestricted).toContain('finances_manage')

      // 9. Fazer downgrade para MEMBER
      await updateMemberRole(app, adminResult.token, memberId, 'MEMBER')

      // 10. Verificar que permissões não restritas foram mantidas e restritas foram removidas
      const memberAfterDowngrade = await getResourceById(app, adminResult.token, 'members', memberId)
      const permissionsAfterDowngrade = (memberAfterDowngrade.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.type)
      expect(permissionsAfterDowngrade).toContain('devotional_manage')
      expect(permissionsAfterDowngrade).toContain('events_manage')
      expect(permissionsAfterDowngrade).toContain('members_view')
      expect(permissionsAfterDowngrade).not.toContain('members_manage')
      expect(permissionsAfterDowngrade).not.toContain('finances_manage')
    })
  })
})


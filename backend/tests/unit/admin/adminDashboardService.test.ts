// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AdminDashboardService } from '../../../src/services/adminDashboardService'
import { prisma } from '../../../src/lib/prisma'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import bcrypt from 'bcryptjs'
import { subDays } from 'date-fns'

describe('AdminDashboardService - Unit Tests', () => {
  const dashboardService = new AdminDashboardService()

  beforeAll(async () => {
    await resetTestDatabase()
  })

  afterAll(async () => {
    await resetTestDatabase()
  })

  describe('ADM_UNIT_DASHBOARD_TS001_TC001: Cálculo de novas igrejas últimos 30 dias', () => {
    it('deve calcular corretamente novas igrejas nos últimos 30 dias', async () => {
      // Cria igrejas em diferentes períodos
      const now = new Date()
      const thirtyDaysAgo = subDays(now, 30)
      const fortyDaysAgo = subDays(now, 40)

      // Igreja criada há 20 dias (deve contar)
      await prisma.church.create({
        data: {
          name: 'Igreja Recente',
          createdAt: subDays(now, 20),
        },
      })

      // Igreja criada há 40 dias (não deve contar)
      await prisma.church.create({
        data: {
          name: 'Igreja Antiga',
          createdAt: fortyDaysAgo,
        },
      })

      const stats = await dashboardService.getDashboardStats()

      expect(stats.newChurchesLast30Days).toBeGreaterThanOrEqual(1)
    })
  })

  describe('ADM_UNIT_DASHBOARD_TS001_TC002: Agrupamento de igrejas por plano', () => {
    it('deve agrupar igrejas corretamente por plano', async () => {
      // Cria planos
      const freePlan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

      const premiumPlan = await prisma.plan.create({
        data: {
          name: 'Premium Plan',
          price: 99.99,
          features: ['advanced'],
          maxMembers: 100,
          maxBranches: 5,
        },
      })

      // Cria usuários com assinaturas
      const user1 = await prisma.user.create({
        data: {
          name: 'User 1',
          email: 'user1@test.com',
          password: await bcrypt.hash('password123', 10),
          Subscription: {
            create: {
              planId: freePlan.id,
              status: 'active',
            },
          },
        },
      })

      const user2 = await prisma.user.create({
        data: {
          name: 'User 2',
          email: 'user2@test.com',
          password: await bcrypt.hash('password123', 10),
          Subscription: {
            create: {
              planId: premiumPlan.id,
              status: 'active',
            },
          },
        },
      })

      const stats = await dashboardService.getDashboardStats()

      expect(stats.churchesByPlan).toBeDefined()
      expect(Array.isArray(stats.churchesByPlan)).toBe(true)

      const freePlanCount = stats.churchesByPlan.find(
        (p) => p.planName === 'Free Plan'
      )?.count
      const premiumPlanCount = stats.churchesByPlan.find(
        (p) => p.planName === 'Premium Plan'
      )?.count

      expect(freePlanCount).toBeGreaterThanOrEqual(1)
      expect(premiumPlanCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('ADM_UNIT_DASHBOARD_TS001_TC003: Cálculo com nenhum dado', () => {
    it('deve retornar zeros quando não há dados', async () => {
      await resetTestDatabase()

      const stats = await dashboardService.getDashboardStats()

      expect(stats.totalUsers).toBe(0)
      expect(stats.totalChurches).toBe(0)
      expect(stats.totalBranches).toBe(0)
      expect(stats.totalMembers).toBe(0)
      expect(stats.newUsersLast7Days).toBe(0)
      expect(stats.newUsersLast30Days).toBe(0)
      expect(stats.newChurchesLast7Days).toBe(0)
      expect(stats.newChurchesLast30Days).toBe(0)
      expect(stats.churchesByPlan).toEqual([])
      expect(stats.activeChurches).toBe(0)
    })
  })

  describe('ADM_UNIT_DASHBOARD_TS001_TC004: Cálculo com muito dado (performance)', () => {
    it('deve calcular corretamente mesmo com muitos dados', async () => {
      await resetTestDatabase()

      // Cria muitos usuários e igrejas
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

      const users = []
      for (let i = 0; i < 50; i++) {
        users.push(
          prisma.user.create({
            data: {
              name: `User ${i}`,
              email: `user${i}@test.com`,
              password: await bcrypt.hash('password123', 10),
              Subscription: {
                create: {
                  planId: plan.id,
                  status: 'active',
                },
              },
            },
          })
        )
      }
      await Promise.all(users)

      const startTime = Date.now()
      const stats = await dashboardService.getDashboardStats()
      const endTime = Date.now()

      expect(stats.totalUsers).toBe(50)
      expect(endTime - startTime).toBeLessThan(5000) // Deve completar em menos de 5 segundos
    })
  })
})




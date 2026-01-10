/**
 * Database utilities for tests
 * 
 * Provides database reset strategies for test isolation.
 * 
 * IMPORTANT: Always reset database in beforeEach of integration/E2E tests
 * to ensure test isolation.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import { prisma } from '../../src/lib/prisma'

/**
 * Reset test database by deleting all records
 * 
 * Deletes records in reverse order of foreign key dependencies
 * to avoid constraint violations.
 * 
 * Safe to call multiple times - catches and ignores errors for
 * non-existent tables.
 * 
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetTestDatabase()
 * })
 * ```
 */
export async function resetTestDatabase() {
  try {
    // Deletar AuditLog primeiro (se existir)
    await prisma.auditLog.deleteMany().catch(() => {
      // Ignora se a tabela não existir ainda
    })
    
    // Deletar em ordem reversa das dependências
    await prisma.devotionalLike.deleteMany().catch(() => {})
    await prisma.devotional.deleteMany().catch(() => {})
    await prisma.notice.deleteMany().catch(() => {})
    await prisma.event.deleteMany().catch(() => {})
    await prisma.transaction.deleteMany().catch(() => {})
    await prisma.contribution.deleteMany().catch(() => {})
    await prisma.permission.deleteMany().catch(() => {})
    await prisma.member.deleteMany().catch(() => {})
    await prisma.branch.deleteMany().catch(() => {})
    await prisma.church.deleteMany().catch(() => {})
    await prisma.onboardingProgress.deleteMany().catch(() => {})
    await prisma.subscription.deleteMany().catch(() => {})
    await prisma.user.deleteMany().catch(() => {})
    await prisma.plan.deleteMany().catch(() => {})
    await prisma.adminUser.deleteMany().catch(() => {})
  } catch (error: any) {
    // Se for erro de tabela não existir, ignora
    if (error.code === 'P2021' || error.code === 'P2001') {
      return
    }
    console.error('Erro ao resetar banco de teste:', error)
    // Não lança erro, apenas loga
  }
}



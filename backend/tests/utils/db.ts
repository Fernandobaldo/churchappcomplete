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
 * IMPORTANT: This function will throw errors if deletion fails (except for
 * table-not-found errors). This ensures test failures are visible and not
 * silently ignored.
 * 
 * @param options Optional configuration
 * @param options.validate If true, validates that database is empty after reset
 * 
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetTestDatabase()
 * })
 * ```
 */
export async function resetTestDatabase(options?: { validate?: boolean }) {
  // Helper para deletar com tratamento de erro apropriado
  async function deleteModel(
    modelName: string,
    deleteFn: () => Promise<any>
  ): Promise<void> {
    try {
      await deleteFn()
    } catch (error: any) {
      // P2021 = Table does not exist (OK para reset)
      // P2001 = Constraint violation (deveria ser tratado, mas ignoramos para tabelas inexistentes)
      if (error.code === 'P2021') {
        // Tabela não existe - OK, continua
        return
      }
      // Outros erros são críticos e devem ser lançados
      throw new Error(
        `Erro ao deletar modelo ${modelName} no reset do banco de teste: ${error.message}. Código: ${error.code}`
      )
    }
  }

  // Helper para deletar modelo que pode não existir no Prisma Client
  async function safeDeleteOptionalModel(modelName: string): Promise<void> {
    try {
      // Verifica se o modelo existe antes de tentar deletar
      const model = (prisma as any)[modelName]
      if (!model || typeof model.deleteMany !== 'function') {
        console.warn(`[RESET] Modelo ${modelName} não está disponível no Prisma Client. Verifique se o Prisma Client foi regenerado (npx prisma generate). Pulando...`)
        return
      }

      await model.deleteMany()
    } catch (error: any) {
      // Se for erro de propriedade não definida, apenas avisa (modelo pode não existir ainda)
      if (error.message?.includes('Cannot read properties of undefined')) {
        console.warn(`[RESET] Modelo ${modelName} não está disponível no Prisma Client. Verifique se o Prisma Client foi regenerado (npx prisma generate). Pulando...`)
        return
      }
      // P2021 = Table does not exist (OK para reset)
      if (error.code === 'P2021') {
        return
      }
      // Outros erros são críticos
      throw new Error(
        `Erro ao deletar modelo ${modelName} no reset do banco de teste: ${error.message}. Código: ${error.code}`
      )
    }
  }

  // Deletar AuditLog primeiro (se existir)
  await deleteModel('auditLog', () => prisma.auditLog.deleteMany())

  // Deletar em ordem reversa das dependências (filhos antes de pais)
  await deleteModel('devotionalLike', () => prisma.devotionalLike.deleteMany())
  await deleteModel('devotional', () => prisma.devotional.deleteMany())
  await deleteModel('notice', () => prisma.notice.deleteMany())
  await deleteModel('event', () => prisma.event.deleteMany())
  await deleteModel('transaction', () => prisma.transaction.deleteMany())
  await deleteModel('contribution', () => prisma.contribution.deleteMany())
  await deleteModel('permission', () => prisma.permission.deleteMany())
  await deleteModel('member', () => prisma.member.deleteMany())
  await deleteModel('branch', () => prisma.branch.deleteMany())
  await deleteModel('church', () => prisma.church.deleteMany())

  // onboardingProgress pode não existir no Prisma Client se não foi regenerado
  // Usa verificação segura
  await safeDeleteOptionalModel('onboardingProgress')

  await deleteModel('subscription', () => prisma.subscription.deleteMany())
  await deleteModel('user', () => prisma.user.deleteMany())
  await deleteModel('plan', () => prisma.plan.deleteMany())
  await deleteModel('adminUser', () => prisma.adminUser.deleteMany())

  // Validação opcional: verifica se o banco está realmente vazio
  if (options?.validate) {
    const counts = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.church.count().catch(() => 0),
      prisma.plan.count().catch(() => 0),
      prisma.member.count().catch(() => 0),
      prisma.branch.count().catch(() => 0),
      prisma.subscription.count().catch(() => 0),
    ])

    const hasData = counts.some((count) => count > 0)
    if (hasData) {
      throw new Error(
        `Reset falhou: dados ainda presentes no banco. Counts: users=${counts[0]}, churches=${counts[1]}, plans=${counts[2]}, members=${counts[3]}, branches=${counts[4]}, subscriptions=${counts[5]}`
      )
    }
  }
}



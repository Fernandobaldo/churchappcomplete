// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { prisma } from '../../src/lib/prisma'

// Ordem correta para deletar registros respeitando dependências de foreign keys
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
    await prisma.subscription.deleteMany().catch(() => {})
    await prisma.user.deleteMany().catch(() => {})
    await prisma.plan.deleteMany().catch(() => {})
  } catch (error: any) {
    // Se for erro de tabela não existir, ignora
    if (error.code === 'P2021' || error.code === 'P2001') {
      return
    }
    console.error('Erro ao resetar banco de teste:', error)
    // Não lança erro, apenas loga
  }
}

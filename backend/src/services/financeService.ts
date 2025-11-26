import { prisma } from '../lib/prisma'
import { TransactionType } from '@prisma/client'

interface CreateTransactionInput {
  title: string
  amount: number
  type: TransactionType
  category?: string
  branchId: string
}

export class FinanceService {
  async getByBranch(branchId: string) {
    return prisma.transaction.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getByBranchWithSummary(branchId: string) {
    const transactions = await this.getByBranch(branchId)
    
    // Calcula resumo
    const entries = transactions
      .filter(t => t.type === 'ENTRY')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const exits = transactions
      .filter(t => t.type === 'EXIT')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const total = entries - exits

    return {
      transactions,
      summary: {
        total,
        entries,
        exits
      }
    }
  }

  async create(data: CreateTransactionInput) {
    return prisma.transaction.create({
      data: {
        title: data.title,
        amount: data.amount,
        type: data.type,
        category: data.category,
        branchId: data.branchId
      }
    })
  }
}


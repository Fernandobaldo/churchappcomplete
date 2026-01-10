import { prisma } from '../lib/prisma'
import { TransactionType, EntryType, ExitType } from '@prisma/client'

interface CreateTransactionInput {
  amount: number
  type: TransactionType
  title?: string | null
  category?: string | null
  entryType?: EntryType
  exitType?: ExitType
  exitTypeOther?: string
  contributionId?: string
  tithePayerMemberId?: string
  tithePayerName?: string
  isTithePayerMember?: boolean
  createdBy?: string
  branchId: string
  date?: Date
}

interface UpdateTransactionInput {
  amount?: number
  type?: TransactionType
  title?: string | null
  category?: string | null
  entryType?: EntryType
  exitType?: ExitType
  exitTypeOther?: string
  contributionId?: string
  tithePayerMemberId?: string
  tithePayerName?: string
  isTithePayerMember?: boolean
  date?: Date
}

interface FilterOptions {
  startDate?: Date
  endDate?: Date
  category?: string
  type?: TransactionType
  search?: string
}

export class FinanceService {
  async getByBranch(branchId: string, filters?: FilterOptions) {
    const where: any = { branchId }

    // Filtro por data
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // Filtro por categoria
    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' }
    }

    // Filtro por tipo
    if (filters?.type) {
      where.type = filters.type
    }

    // Filtro de pesquisa (título, membro, etc.)
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { tithePayerName: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        CreatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Contribution: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    // Buscar nomes dos membros dizimistas
    const transactionsWithMembers = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.tithePayerMemberId) {
          const member = await prisma.member.findUnique({
            where: { id: transaction.tithePayerMemberId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
          return {
            ...transaction,
            TithePayerMember: member,
          }
        }
        return transaction
      })
    )

    return transactionsWithMembers
  }

  async getByBranchWithSummary(branchId: string, filters?: FilterOptions, isCurrentMonth: boolean = false) {
    // Se não há filtros de data, usar mês atual como padrão
    if (!filters?.startDate && !filters?.endDate) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      
      filters = {
        ...filters,
        startDate: startOfMonth,
        endDate: endOfMonth,
      }
    }

    // Buscar transações com os filtros aplicados (para exibição na lista)
    const transactions = await this.getByBranch(branchId, filters)
    
    // Calcula entradas e saídas do período filtrado
    const entries = transactions
      .filter(t => t.type === 'ENTRY')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const exits = transactions
      .filter(t => t.type === 'EXIT')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    // Se for "Este Mês" (preset current), calcular saldo total sem NENHUM filtro (saldo real)
    // Caso contrário, calcular saldo total apenas do período filtrado
    let total: number
    if (isCurrentMonth) {
      // Buscar TODAS as transações (sem nenhum filtro) para calcular o saldo total real
      const allTransactions = await this.getByBranch(branchId, {
        // Sem filtros - apenas branchId
      })
      
      const allEntries = allTransactions
        .filter(t => t.type === 'ENTRY')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const allExits = allTransactions
        .filter(t => t.type === 'EXIT')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      total = allEntries - allExits
    } else {
      // Para outros períodos, usar apenas as transações do período filtrado
      total = entries - exits
    }

    return {
      transactions,
      summary: {
        total,      // Saldo total: real se current, ou do período se outros presets
        entries,    // Total de entradas do período filtrado
        exits       // Total de saídas do período filtrado
      }
    }
  }

  async getById(id: string, branchId: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        branchId,
      },
      include: {
        CreatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Contribution: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    }).then(async (transaction) => {
      if (!transaction) return null
      
      // Se houver tithePayerMemberId, buscar informações do membro
      if (transaction.tithePayerMemberId) {
        const member = await prisma.member.findUnique({
          where: { id: transaction.tithePayerMemberId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        
        return {
          ...transaction,
          TithePayerMember: member,
        }
      }
      
      return transaction
    })
  }

  async create(data: CreateTransactionInput) {
    // Construir objeto de dados removendo campos undefined
    const transactionData: any = {
      amount: data.amount,
      type: data.type,
      branchId: data.branchId,
      date: data.date || new Date()
    }

    // Adicionar campos opcionais apenas se estiverem definidos
    if (data.title !== undefined) transactionData.title = data.title
    if (data.category !== undefined) transactionData.category = data.category
    if (data.entryType) transactionData.entryType = data.entryType
    if (data.exitType) transactionData.exitType = data.exitType
    if (data.exitTypeOther) transactionData.exitTypeOther = data.exitTypeOther
    if (data.contributionId) transactionData.contributionId = data.contributionId
    if (data.tithePayerMemberId) transactionData.tithePayerMemberId = data.tithePayerMemberId
    if (data.tithePayerName) transactionData.tithePayerName = data.tithePayerName
    if (data.isTithePayerMember !== undefined) transactionData.isTithePayerMember = data.isTithePayerMember
    if (data.createdBy) transactionData.createdBy = data.createdBy

    return prisma.transaction.create({
      data: transactionData,
      include: {
        CreatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Contribution: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  }

  async update(id: string, branchId: string, data: UpdateTransactionInput) {
    // Verificar se a transação existe e pertence à branch
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        branchId,
      },
    })

    if (!existing) {
      throw new Error('Transação não encontrada ou não pertence à filial')
    }

    return prisma.transaction.update({
      where: {
        id,
      },
      data: {
        ...data,
      },
      include: {
        CreatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Contribution: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  }

  async delete(id: string, branchId: string) {
    // Verificar se a transação existe e pertence à branch
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        branchId,
      },
    })

    if (!existing) {
      throw new Error('Transação não encontrada ou não pertence à filial')
    }

    return prisma.transaction.delete({
      where: {
        id,
      },
    })
  }
}


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinanceService } from '../../src/services/financeService'
import { prisma } from '../../src/lib/prisma'

vi.mock('../../src/lib/prisma', () => {
  const mock = {
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }

  return { prisma: mock }
})

const service = new FinanceService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FinanceService', () => {
  const mockBranchId = 'branch-123'

  describe('getByBranch', () => {
    // Teste 1: Success - Listar transações
    it('deve retornar todas as transações de uma filial ordenadas por data de criação (desc)', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: mockBranchId,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'transaction-2',
          title: 'Pagamento',
          amount: 500.0,
          type: 'EXIT',
          category: 'Despesas',
          branchId: mockBranchId,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      // Act
      const result = await service.getByBranch(mockBranchId)

      // Assert
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { branchId: mockBranchId },
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
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockTransactions)
    })

    // Teste 2: Edge case #1 - Array vazio
    it('deve retornar array vazio quando não há transações', async () => {
      // Arrange
      ;(prisma.transaction.findMany as any).mockResolvedValue([])

      // Act
      const result = await service.getByBranch(mockBranchId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getByBranchWithSummary', () => {
    // Teste 3: Success - Resumo com entradas e saídas
    it('deve retornar transações e resumo correto com entradas e saídas', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'transaction-2',
          title: 'Oferta',
          amount: 500.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'transaction-3',
          title: 'Pagamento',
          amount: 300.0,
          type: 'EXIT',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      // Act
      const result = await service.getByBranchWithSummary(mockBranchId)

      // Assert
      expect(result).toHaveProperty('transactions')
      expect(result).toHaveProperty('summary')
      expect(result.transactions).toEqual(mockTransactions)
      expect(result.summary.entries).toBe(1500.0)
      expect(result.summary.exits).toBe(300.0)
      expect(result.summary.total).toBe(1200.0)
    })

    it('deve retornar resumo zerado quando não há transações', async () => {
      ;(prisma.transaction.findMany as any).mockResolvedValue([])

      const result = await service.getByBranchWithSummary(mockBranchId)

      expect(result.transactions).toEqual([])
      expect(result.summary.entries).toBe(0)
      expect(result.summary.exits).toBe(0)
      expect(result.summary.total).toBe(0)
    })

    it('deve calcular corretamente apenas entradas', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'transaction-2',
          title: 'Oferta',
          amount: 500.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      const result = await service.getByBranchWithSummary(mockBranchId)

      expect(result.summary.entries).toBe(1500.0)
      expect(result.summary.exits).toBe(0)
      expect(result.summary.total).toBe(1500.0)
    })

    it('deve calcular corretamente apenas saídas', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Pagamento 1',
          amount: 300.0,
          type: 'EXIT',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'transaction-2',
          title: 'Pagamento 2',
          amount: 200.0,
          type: 'EXIT',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      const result = await service.getByBranchWithSummary(mockBranchId)

      expect(result.summary.entries).toBe(0)
      expect(result.summary.exits).toBe(500.0)
      expect(result.summary.total).toBe(-500.0)
    })

    it('deve converter valores corretamente usando Number()', async () => {
      // Simula valores que podem vir como Decimal do Prisma
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: '1000.50' as any, // Simula Decimal do Prisma
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      const result = await service.getByBranchWithSummary(mockBranchId)

      expect(result.summary.entries).toBe(1000.5)
    })
  })

  describe('create', () => {
    // Teste 4: Success - Criar transação
    it('deve criar uma transação de entrada com todos os campos', async () => {
      // Arrange
      const transactionData = {
        title: 'Dízimo',
        amount: 1000.0,
        type: 'ENTRY' as const,
        category: 'Dízimo',
        entryType: 'DIZIMO' as const,
        tithePayerMemberId: 'member-123',
        tithePayerName: 'João Silva',
        isTithePayerMember: true,
        branchId: mockBranchId,
      }

      const mockCreatedTransaction = {
        id: 'transaction-123',
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as any).mockResolvedValue(mockCreatedTransaction)

      const result = await service.create(transactionData)

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          title: transactionData.title,
          amount: transactionData.amount,
          type: transactionData.type,
          branchId: transactionData.branchId,
          date: expect.any(Date),
          category: transactionData.category,
          entryType: transactionData.entryType,
          tithePayerMemberId: transactionData.tithePayerMemberId,
          tithePayerName: transactionData.tithePayerName,
          isTithePayerMember: transactionData.isTithePayerMember,
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
      expect(result).toEqual(mockCreatedTransaction)
    })

    it('deve criar uma transação de saída sem campos de entrada', async () => {
      const transactionData = {
        title: 'Pagamento de Conta',
        amount: 500.0,
        type: 'EXIT' as const,
        category: 'Despesas',
        branchId: mockBranchId,
      }

      const mockCreatedTransaction = {
        id: 'transaction-123',
        ...transactionData,
        entryType: null,
        tithePayerMemberId: null,
        tithePayerName: null,
        isTithePayerMember: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as any).mockResolvedValue(mockCreatedTransaction)

      const result = await service.create(transactionData)

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          title: transactionData.title,
          amount: transactionData.amount,
          type: transactionData.type,
          branchId: transactionData.branchId,
          date: expect.any(Date),
          category: transactionData.category,
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
      expect(result).toEqual(mockCreatedTransaction)
    })

    it('deve criar uma transação de oferta sem dizimista', async () => {
      const transactionData = {
        title: 'Oferta',
        amount: 200.0,
        type: 'ENTRY' as const,
        category: 'Oferta',
        entryType: 'OFERTA' as const,
        branchId: mockBranchId,
      }

      const mockCreatedTransaction = {
        id: 'transaction-123',
        ...transactionData,
        tithePayerMemberId: null,
        tithePayerName: null,
        isTithePayerMember: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as any).mockResolvedValue(mockCreatedTransaction)

      const result = await service.create(transactionData)

      expect(prisma.transaction.create).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedTransaction)
    })

    it('deve criar uma transação de dízimo com dizimista não membro', async () => {
      const transactionData = {
        title: 'Dízimo',
        amount: 1000.0,
        type: 'ENTRY' as const,
        category: 'Dízimo',
        entryType: 'DIZIMO' as const,
        tithePayerName: 'Visitante Silva',
        isTithePayerMember: false,
        branchId: mockBranchId,
      }

      const mockCreatedTransaction = {
        id: 'transaction-123',
        ...transactionData,
        tithePayerMemberId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as any).mockResolvedValue(mockCreatedTransaction)

      const result = await service.create(transactionData)

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          title: transactionData.title,
          amount: transactionData.amount,
          type: transactionData.type,
          branchId: transactionData.branchId,
          date: expect.any(Date),
          category: transactionData.category,
          entryType: transactionData.entryType,
          tithePayerName: transactionData.tithePayerName,
          isTithePayerMember: transactionData.isTithePayerMember,
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
      expect(result).toEqual(mockCreatedTransaction)
    })
  })

  describe('getById', () => {
    it('deve retornar transação específica por ID', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        title: 'Dízimo',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        branchId: mockBranchId,
        createdAt: new Date(),
        updatedAt: new Date(),
        CreatedByUser: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        Contribution: null,
      }

      ;(prisma.transaction.findFirst as any).mockResolvedValue(mockTransaction)

      const result = await service.getById('transaction-123', mockBranchId)

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'transaction-123',
          branchId: mockBranchId,
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
      })
      expect(result).toEqual(mockTransaction)
    })

    it('deve retornar null quando transação não existe', async () => {
      ;(prisma.transaction.findFirst as any).mockResolvedValue(null)

      const result = await service.getById('non-existent', mockBranchId)

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('deve atualizar transação com sucesso', async () => {
      const existingTransaction = {
        id: 'transaction-123',
        title: 'Original',
        amount: 500.0,
        type: 'ENTRY' as const,
        branchId: mockBranchId,
      }

      const updateData = {
        title: 'Atualizado',
        amount: 750.0,
      }

      const updatedTransaction = {
        ...existingTransaction,
        ...updateData,
        CreatedByUser: null,
        Contribution: null,
      }

      ;(prisma.transaction.findFirst as any).mockResolvedValue(existingTransaction)
      ;(prisma.transaction.update as any).mockResolvedValue(updatedTransaction)

      const result = await service.update('transaction-123', mockBranchId, updateData)

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'transaction-123',
          branchId: mockBranchId,
        },
      })
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-123' },
        data: updateData,
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
      expect(result).toEqual(updatedTransaction)
    })

    it('deve lançar erro quando transação não existe', async () => {
      ;(prisma.transaction.findFirst as any).mockResolvedValue(null)

      await expect(
        service.update('non-existent', mockBranchId, { title: 'Test' })
      ).rejects.toThrow('Transação não encontrada ou não pertence à filial')
    })
  })

  describe('delete', () => {
    it('deve excluir transação com sucesso', async () => {
      const existingTransaction = {
        id: 'transaction-123',
        title: 'Para Excluir',
        branchId: mockBranchId,
      }

      ;(prisma.transaction.findFirst as any).mockResolvedValue(existingTransaction)
      ;(prisma.transaction.delete as any).mockResolvedValue(existingTransaction)

      const result = await service.delete('transaction-123', mockBranchId)

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'transaction-123',
          branchId: mockBranchId,
        },
      })
      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'transaction-123' },
      })
      expect(result).toEqual(existingTransaction)
    })

    it('deve lançar erro quando transação não existe', async () => {
      ;(prisma.transaction.findFirst as any).mockResolvedValue(null)

      await expect(
        service.delete('non-existent', mockBranchId)
      ).rejects.toThrow('Transação não encontrada ou não pertence à filial')
    })
  })

  describe('getByBranchWithSummary com filtros', () => {
    it('deve aplicar filtro de data', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      const result = await service.getByBranchWithSummary(mockBranchId, {
        startDate,
        endDate,
      })

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          branchId: mockBranchId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result.transactions).toEqual(mockTransactions)
    })

    it('deve aplicar filtro de categoria', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          category: 'Dízimo',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      await service.getByBranchWithSummary(mockBranchId, {
        category: 'Dízimo',
      })

      // Verifica que foi chamado com os parâmetros corretos
      const call = (prisma.transaction.findMany as any).mock.calls[0][0]
      
      // Verifica o branchId
      expect(call.where.branchId).toBe(mockBranchId)
      
      // Verifica o filtro de categoria
      expect(call.where.category).toEqual({ contains: 'Dízimo', mode: 'insensitive' })
      
      // Verifica que filtros de data foram adicionados automaticamente (mês atual)
      expect(call.where.createdAt).toBeDefined()
      expect(call.where.createdAt.gte).toBeInstanceOf(Date)
      expect(call.where.createdAt.lte).toBeInstanceOf(Date)
      
      // Verifica o include com a estrutura esperada
      expect(call.include).toEqual({
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
      })
      
      // Verifica o orderBy
      expect(call.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('deve aplicar filtro de tipo', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo',
          amount: 1000.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      await service.getByBranchWithSummary(mockBranchId, {
        type: 'ENTRY',
      })

      // Verifica que foi chamado com os parâmetros corretos
      const call = (prisma.transaction.findMany as any).mock.calls[0][0]
      
      // Verifica o branchId
      expect(call.where.branchId).toBe(mockBranchId)
      
      // Verifica o filtro de tipo
      expect(call.where.type).toBe('ENTRY')
      
      // Verifica que filtros de data foram adicionados automaticamente (mês atual)
      expect(call.where.createdAt).toBeDefined()
      expect(call.where.createdAt.gte).toBeInstanceOf(Date)
      expect(call.where.createdAt.lte).toBeInstanceOf(Date)
      
      // Verifica o include com a estrutura esperada
      expect(call.include).toEqual({
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
      })
      
      // Verifica o orderBy
      expect(call.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('deve aplicar filtro de pesquisa', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          title: 'Dízimo de João',
          amount: 1000.0,
          type: 'ENTRY',
          branchId: mockBranchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      await service.getByBranchWithSummary(mockBranchId, {
        search: 'João',
      })

      // Verifica que foi chamado com os parâmetros corretos
      const call = (prisma.transaction.findMany as any).mock.calls[0][0]
      
      // Verifica o branchId
      expect(call.where.branchId).toBe(mockBranchId)
      
      // Verifica o filtro de pesquisa (OR)
      expect(call.where.OR).toEqual([
        { title: { contains: 'João', mode: 'insensitive' } },
        { category: { contains: 'João', mode: 'insensitive' } },
        { tithePayerName: { contains: 'João', mode: 'insensitive' } },
      ])
      
      // Verifica que filtros de data foram adicionados automaticamente (mês atual)
      expect(call.where.createdAt).toBeDefined()
      expect(call.where.createdAt.gte).toBeInstanceOf(Date)
      expect(call.where.createdAt.lte).toBeInstanceOf(Date)
      
      // Verifica o include com a estrutura esperada
      expect(call.include).toEqual({
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
      })
      
      // Verifica o orderBy
      expect(call.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('deve usar mês atual como padrão quando não há filtros de data', async () => {
      const mockTransactions = []
      ;(prisma.transaction.findMany as any).mockResolvedValue(mockTransactions)

      await service.getByBranchWithSummary(mockBranchId)

      const call = (prisma.transaction.findMany as any).mock.calls[0][0]
      expect(call.where.createdAt).toBeDefined()
      expect(call.where.createdAt.gte).toBeInstanceOf(Date)
      expect(call.where.createdAt.lte).toBeInstanceOf(Date)
    })
  })
})


import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { FinanceService } from '../services/financeService'
import { createTransactionBodySchema, updateTransactionBodySchema } from '../schemas/financeSchemas'

export class FinanceController {
  private service = new FinanceService()

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user
      if (!user?.branchId) {
        return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
      }

      const query = request.query as any
      const filters: any = {}

      // Verificar se é o preset "current" (Este Mês) - padrão
      const isCurrentMonth = query.monthPreset === 'current' || (!query.monthPreset && !query.startDate && !query.endDate)

      // Filtro de data
      if (query.startDate) {
        filters.startDate = new Date(query.startDate)
      }
      if (query.endDate) {
        filters.endDate = new Date(query.endDate)
      }

      // Filtro de categoria
      if (query.category) {
        filters.category = query.category
      }

      // Filtro de tipo
      if (query.type) {
        filters.type = query.type
      }

      // Filtro de pesquisa
      if (query.search) {
        filters.search = query.search
      }
      
      const result = await this.service.getByBranchWithSummary(user.branchId, filters, isCurrentMonth)
      return reply.send(result)
    } catch (error: any) {
      console.error('❌ Erro ao buscar transações:', error)
      return reply.status(500).send({ error: 'Erro interno ao buscar transações', details: error.message })
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const user = request.user

      if (!user?.branchId) {
        return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
      }

      const transaction = await this.service.getById(id, user.branchId)

      if (!transaction) {
        return reply.status(404).send({ message: 'Transação não encontrada' })
      }

      return reply.send(transaction)
    } catch (error: any) {
      console.error('❌ Erro ao buscar transação:', error)
      return reply.status(500).send({ error: 'Erro interno ao buscar transação', details: error.message })
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createTransactionBodySchema.parse(request.body)
      const user = request.user

      if (!user?.branchId) {
        return reply.status(400).send({ 
          message: 'Usuário não está associado a uma filial. Não é possível criar transação.' 
        })
      }

      // Validar contributionId se fornecido
      if (data.contributionId) {
        const { prisma } = await import('../lib/prisma')
        const contribution = await prisma.contribution.findUnique({
          where: { id: data.contributionId },
        })
        if (!contribution) {
          return reply.status(400).send({ message: 'Contribuição não encontrada' })
        }
        if (contribution.branchId !== user.branchId) {
          return reply.status(403).send({ message: 'Contribuição não pertence à mesma filial' })
        }
      }

      const created = await this.service.create({
        ...data,
        createdBy: user.id,
        branchId: user.branchId
      })

      return reply.code(201).send(created)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      console.error('❌ Erro ao criar transação:', error)
      return reply.status(500).send({ error: 'Erro interno ao criar transação', details: error.message })
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const data = updateTransactionBodySchema.parse(request.body)
      const user = request.user

      if (!user?.branchId) {
        return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
      }

      // Verificar se a transação existe e pertence à filial
      const existing = await this.service.getById(id, user.branchId)
      if (!existing) {
        return reply.status(404).send({ message: 'Transação não encontrada' })
      }

      // Validar contributionId se fornecido
      if (data.contributionId) {
        const { prisma } = await import('../lib/prisma')
        const contribution = await prisma.contribution.findUnique({
          where: { id: data.contributionId },
        })
        if (!contribution) {
          return reply.status(400).send({ message: 'Contribuição não encontrada' })
        }
        if (contribution.branchId !== user.branchId) {
          return reply.status(403).send({ message: 'Contribuição não pertence à mesma filial' })
        }
      }

      const updated = await this.service.update(id, user.branchId, data)
      return reply.send(updated)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      console.error('❌ Erro ao atualizar transação:', error)
      return reply.status(500).send({ error: 'Erro interno ao atualizar transação', details: error.message })
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const user = request.user

      if (!user?.branchId) {
        return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
      }

      // Verificar se a transação existe e pertence à filial
      const existing = await this.service.getById(id, user.branchId)
      if (!existing) {
        return reply.status(404).send({ message: 'Transação não encontrada' })
      }

      await this.service.delete(id, user.branchId)
      return reply.code(204).send()
    } catch (error: any) {
      console.error('❌ Erro ao excluir transação:', error)
      return reply.status(500).send({ error: 'Erro interno ao excluir transação', details: error.message })
    }
  }
}


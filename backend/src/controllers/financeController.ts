import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { FinanceService } from '../services/financeService'
import { createTransactionBodySchema } from '../schemas/financeSchemas'

export class FinanceController {
  private service = new FinanceService()

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    if (!user?.branchId) {
      return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
    }
    
    const result = await this.service.getByBranchWithSummary(user.branchId)
    return reply.send(result)
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

      const created = await this.service.create({
        ...data,
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
}


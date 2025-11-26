import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { ContributionService } from '../services/contributionService'
import { createContributionBodySchema } from '../schemas/contributionSchemas'

export class ContributionController {
  private service = new ContributionService()

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    if (!user?.branchId) {
      return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
    }
    const contributions = await this.service.getByBranch(user.branchId)
    return reply.send(contributions)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createContributionBodySchema.parse(request.body)
      const user = request.user

      // branchId já foi validado pelo middleware checkBranchId

      // Converte data YYYY-MM-DD para ISO 8601 se necessário
      let dateValue = data.date
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        // Se for apenas data (YYYY-MM-DD), adiciona hora para ISO 8601
        dateValue = `${data.date}T00:00:00.000Z`
      }

      const created = await this.service.create({
        ...data,
        date: dateValue,
        branchId: user.branchId
      })

      return reply.code(201).send(created)
    } catch (error: any) {
      // Erros de validação do Zod retornam 400 (Bad Request)
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      // Outros erros retornam 500
      console.error('❌ Erro ao criar contribuição:', error)
      return reply.status(500).send({ error: 'Erro interno ao criar contribuição', details: error.message })
    }
  }

  async getTypes(_: FastifyRequest, reply: FastifyReply) {
    return reply.send([
      { label: 'Dízimo', value: 'DIZIMO' },
      { label: 'Oferta', value: 'OFERTA' },
      { label: 'Outro', value: 'OUTRO' },
    ])
  }
}

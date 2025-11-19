import { FastifyRequest, FastifyReply } from 'fastify'
import { ContributionService } from '../services/contributionService'
import { createContributionSchema } from '../schemas/contributionSchemas'

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
    const data = createContributionSchema.body.parse(request.body)
    const user = request.user

    const created = await this.service.create({
      ...data,
      branchId: user.branchId
    })

    return reply.code(201).send(created)
  }

  async getTypes(_: FastifyRequest, reply: FastifyReply) {
    return reply.send([
      { label: 'Dízimo', value: 'DIZIMO' },
      { label: 'Oferta', value: 'OFERTA' },
      { label: 'Outro', value: 'OUTRO' },
    ])
  }
}

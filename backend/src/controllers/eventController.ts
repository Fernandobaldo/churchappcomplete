import { FastifyRequest, FastifyReply } from 'fastify'
import { EventService } from '../services/eventService'
import { createEventSchema } from '../schemas'
import { parse, isValid } from 'date-fns'

export class EventController {
private service = new EventService()

async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    const events = await this.service.getAll(user.branchId)
    return reply.send(events)
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const event = await this.service.getById(id)

    if (!event) {
      return reply.status(404).send({ message: 'Evento não encontrado' })
    }

    return reply.send(event)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createEventSchema.body.parse(request.body)
    const user = request.user

    const parsedStartDate = parse(body.startDate.trim(), 'dd-MM-yyyy', new Date())
    const parsedEndDate = parse(body.endDate.trim(), 'dd-MM-yyyy', new Date())

    const newEvent = await this.service.create({
      ...body,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      branchId: user.branchId,
    })

    return reply.status(201).send(newEvent)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const body = request.body as any
    const user = request.user

    const parsedStartDate = body.startDate
      ? parse(body.startDate.trim(), 'dd/MM/yyyy', new Date())
      : undefined

    const parsedEndDate = body.endDate
      ? parse(body.endDate.trim(), 'dd/MM/yyyy', new Date())
      : undefined

    const updated = await this.service.update(id, {
      ...body,
      startDate: isValid(parsedStartDate) ? parsedStartDate : undefined,
      endDate: isValid(parsedEndDate) ? parsedEndDate : undefined,
    })

    return reply.send(updated)
  }
}

// src/routes/eventsRoutes.ts
import { FastifyInstance } from 'fastify'
import { isValid, parse } from 'date-fns'
import { prisma } from '../lib/prisma'
import { checkRole } from '../middlewares/checkRole'
import { checkPermission } from '../middlewares/checkPermission'
import {
eventBodySchema,
eventIdParamSchema,
updateEventSchema,
} from '../schemas/eventSchemas'

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user

    // Se o usuário não tem branchId (usuário sem membro associado), retorna array vazio
    if (!user.branchId) {
      return reply.send([])
    }

    const events = await prisma.event.findMany({
      where: {
        branchId: user.branchId,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return reply.send(events)
  })

  // Rota para obter o próximo evento (deve vir antes de /:id para não ser capturada como parâmetro)
  app.get('/next', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user

    // Se o usuário não tem branchId (usuário sem membro associado), retorna null
    if (!user.branchId) {
      return reply.send(null)
    }

    const now = new Date()

    const nextEvent = await prisma.event.findFirst({
      where: {
        branchId: user.branchId,
        startDate: {
          gte: now, // Eventos que começam a partir de agora
        },
      },
      orderBy: {
        startDate: 'asc', // Ordena por data mais próxima
      },
    })

    // Retorna null quando não há eventos próximos (200 OK)
    return reply.send(nextEvent || null)
  })

  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = eventIdParamSchema.params.parse(request.params)

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            name: true,
            churchId: true,
          },
        },
      },
    })

    if (!event) {
      return reply.status(404).send({ message: 'Evento não encontrado' })
    }

    return reply.send(event)
  })

  app.post(
    '/',
    {
      preHandler: [
        app.authenticate,
        checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      const data = eventBodySchema.parse(request.body)
      const user = request.user

      // Se o usuário não tem branchId (usuário sem membro associado), retorna erro
      if (!user.branchId) {
        return reply.status(400).send({ 
          message: 'Usuário não está associado a uma filial. Não é possível criar eventos.' 
        })
      }

      const parsedStartDate = parse(data.startDate.trim(), 'dd/MM/yyyy', new Date())
      const parsedEndDate = parse(data.endDate.trim(), 'dd/MM/yyyy', new Date())

      const newEvent = await prisma.event.create({
        data: {
          title: data.title,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          time: data.time,
          location: data.location,
          description: data.description,
          hasDonation: data.hasDonation ?? false,
          donationReason: data.donationReason,
          donationLink: data.donationLink,
          imageUrl: data.imageUrl,
          branchId: user.branchId,
        },
      })

      return reply.status(201).send(newEvent)
    }
)

app.put(
    '/:id',
    {
      preHandler: [
        app.authenticate,
        checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      const { id } = eventIdParamSchema.params.parse(request.params)
      const data = updateEventSchema.body.parse(request.body)

      const existing = await prisma.event.findUnique({
        where: { id },
        include: {
          branch: {
            select: { id: true, churchId: true },
          },
        },
      })

      if (!existing || !existing.branch?.churchId) {
        return reply.status(404).send({ message: 'Evento ou filial não encontrada.' })
      }

      const parsedStartDate = data.startDate
        ? parse(data.startDate.trim(), 'dd/MM/yyyy', new Date())
        : undefined

      const parsedEndDate = data.endDate
        ? parse(data.endDate.trim(), 'dd/MM/yyyy', new Date())
        : undefined

      const updated = await prisma.event.update({
        where: { id },
        data: {
          title: data.title,
          startDate: isValid(parsedStartDate) ? parsedStartDate : undefined,
          endDate: isValid(parsedEndDate) ? parsedEndDate : undefined,
          time: data.time,
          location: data.location,
          description: data.description,
          hasDonation: data.hasDonation ?? false,
          donationReason: data.hasDonation ? data.donationReason : null,
          donationLink: data.hasDonation ? data.donationLink : null,
        },
      })

      return reply.send(updated)
    }
)
}

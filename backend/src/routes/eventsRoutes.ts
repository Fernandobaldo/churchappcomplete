// src/routes/eventsRoutes.ts
import { FastifyInstance } from 'fastify'
import { isValid, parse } from 'date-fns'
import { prisma } from '../lib/prisma'
import { checkRole } from '../middlewares/checkRole'
import { checkPermission } from '../middlewares/checkPermission'
import { checkBranchId } from '../middlewares/checkBranchId'
import { authenticate } from '../middlewares/authenticate'
import {
eventBodySchema,
eventIdParamSchema,
updateEventSchema,
} from '../schemas/eventSchemas'

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user

    // Se o usuário não tem branchId (usuário sem membro associado), retorna array vazio
    if (!user?.branchId) {
      return reply.send([])
    }

    const events = await prisma.event.findMany({
      where: {
        branchId: user.branchId!,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return reply.send(events)
  })

  // Rota para obter o próximo evento (deve vir antes de /:id para não ser capturada como parâmetro)
  app.get('/next', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user

    // Se o usuário não tem branchId (usuário sem membro associado), retorna null
    if (!user?.branchId) {
      return reply.send(null)
    }

    const now = new Date()

    const nextEvent = await prisma.event.findFirst({
      where: {
        branchId: user.branchId!,
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

  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = eventIdParamSchema.params.parse(request.params)

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        Branch: {
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
        authenticate,
        checkBranchId(), // Verifica branchId antes dos middlewares de permissão
        checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      try {
        const data = eventBodySchema.parse(request.body)
        const user = request.user
        
        if (!user?.branchId) {
          return reply.status(400).send({ 
            message: 'Usuário não está associado a uma filial. Não é possível criar eventos.' 
          })
        }

        // Aceita formato ISO (YYYY-MM-DDTHH:mm:ss) ou dd/MM/yyyy
        let parsedStartDate: Date
        let parsedEndDate: Date
        
        // Tenta parse ISO primeiro, depois dd/MM/yyyy
        const isoStartDate = new Date(data.startDate)
        const isoEndDate = new Date(data.endDate)
        
        if (!isNaN(isoStartDate.getTime())) {
          parsedStartDate = isoStartDate
        } else {
          parsedStartDate = parse(data.startDate.trim(), 'dd/MM/yyyy', new Date())
        }
        
        if (!isNaN(isoEndDate.getTime())) {
          parsedEndDate = isoEndDate
        } else {
          parsedEndDate = parse(data.endDate.trim(), 'dd/MM/yyyy', new Date())
        }

        const newEvent = await prisma.event.create({
          data: {
            title: data.title,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            time: data.time || 'Não especificado',
            location: data.location || 'Não especificado',
            description: data.description,
            hasDonation: data.hasDonation ?? false,
            donationReason: data.donationReason,
            donationLink: data.donationLink,
            imageUrl: data.imageUrl,
            branchId: user.branchId!,
          },
        })

        return reply.status(201).send(newEvent)
      } catch (error: any) {
        // Erros de validação do Zod retornam 400 (Bad Request)
        if (error.name === 'ZodError') {
          return reply.status(400).send({ 
            error: 'Dados inválidos', 
            message: error.errors?.[0]?.message || 'Erro de validação',
            details: error.errors 
          })
        }

        // Outros erros retornam 500
        console.error('❌ Erro ao criar evento:', error)
        return reply.status(500).send({ error: 'Erro interno ao criar evento', details: error.message })
      }
    }
)

app.put(
    '/:id',
    {
      preHandler: [
        authenticate,
        checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = eventIdParamSchema.params.parse(request.params)
        const data = updateEventSchema.body.parse(request.body)

        const existing = await prisma.event.findUnique({
          where: { id },
          include: {
            Branch: {
              select: { id: true, churchId: true },
            },
          },
        })

        if (!existing || !existing.Branch?.churchId) {
          return reply.status(404).send({ message: 'Evento ou filial não encontrada.' })
        }

      // Aceita formato ISO (YYYY-MM-DDTHH:mm:ss) ou dd/MM/yyyy
      let parsedStartDate: Date | undefined
      let parsedEndDate: Date | undefined
      
      if (data.startDate) {
        const isoStartDate = new Date(data.startDate)
        if (!isNaN(isoStartDate.getTime())) {
          parsedStartDate = isoStartDate
        } else {
          parsedStartDate = parse(data.startDate.trim(), 'dd/MM/yyyy', new Date())
        }
      }
      
      if (data.endDate) {
        const isoEndDate = new Date(data.endDate)
        if (!isNaN(isoEndDate.getTime())) {
          parsedEndDate = isoEndDate
        } else {
          parsedEndDate = parse(data.endDate.trim(), 'dd/MM/yyyy', new Date())
        }
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          title: data.title,
          startDate: parsedStartDate && isValid(parsedStartDate) ? parsedStartDate : undefined,
          endDate: parsedEndDate && isValid(parsedEndDate) ? parsedEndDate : undefined,
          time: data.time,
          location: data.location,
          description: data.description,
          hasDonation: data.hasDonation ?? false,
          donationReason: data.hasDonation ? data.donationReason : null,
          donationLink: data.hasDonation ? data.donationLink : null,
        },
      })

        return reply.send(updated)
      } catch (error: any) {
        // Erros de validação do Zod retornam 400 (Bad Request)
        if (error.name === 'ZodError') {
          return reply.status(400).send({ 
            error: 'Dados inválidos', 
            message: error.errors?.[0]?.message || 'Erro de validação',
            details: error.errors 
          })
        }

        // Outros erros retornam 500
        console.error('❌ Erro ao atualizar evento:', error)
        return reply.status(500).send({ error: 'Erro interno ao atualizar evento', details: error.message })
      }
    }
)
}

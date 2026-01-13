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
        // checkPermission já verifica se é ADMINGERAL/ADMINFILIAL (têm todas as permissões)
        // ou se tem a permissão events_manage específica
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

        // Aceita formato ISO (YYYY-MM-DDTHH:mm:ss) ou dd-MM-yyyy
        let parsedStartDate: Date
        let parsedEndDate: Date
        
        // Verifica se é formato ISO válido (YYYY-MM-DD)
        const isoRegex = /^\d{4}-\d{2}-\d{2}/
        const isISOStart = isoRegex.test(data.startDate)
        const isISOEnd = isoRegex.test(data.endDate)
        
        if (isISOStart) {
          // Formato ISO: YYYY-MM-DD
          parsedStartDate = new Date(data.startDate)
          if (isNaN(parsedStartDate.getTime())) {
            throw new Error('Data de início inválida (formato ISO)')
          }
        } else {
          // Formato brasileiro: dd-MM-yyyy
          try {
            parsedStartDate = parse(data.startDate.trim(), 'dd-MM-yyyy', new Date())
            if (isNaN(parsedStartDate.getTime())) {
              throw new Error('Data de início inválida (formato dd-MM-yyyy)')
            }
          } catch (error) {
            throw new Error(`Data de início inválida: ${data.startDate}. Use formato dd-MM-yyyy`)
          }
        }
        
        if (isISOEnd) {
          // Formato ISO: YYYY-MM-DD
          parsedEndDate = new Date(data.endDate)
          if (isNaN(parsedEndDate.getTime())) {
            throw new Error('Data de fim inválida (formato ISO)')
          }
        } else {
          // Formato brasileiro: dd-MM-yyyy
          try {
            parsedEndDate = parse(data.endDate.trim(), 'dd-MM-yyyy', new Date())
            if (isNaN(parsedEndDate.getTime())) {
              throw new Error('Data de fim inválida (formato dd-MM-yyyy)')
            }
          } catch (error) {
            throw new Error(`Data de fim inválida: ${data.endDate}. Use formato dd-MM-yyyy`)
          }
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
        // checkPermission já verifica se é ADMINGERAL/ADMINFILIAL (têm todas as permissões)
        // ou se tem a permissão events_manage específica
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = eventIdParamSchema.params.parse(request.params)
        const rawBody = request.body as any
        const data = updateEventSchema.body.parse(request.body)

        // Verificar se imageUrl foi explicitamente enviado como null (para remover)
        const imageUrlWasExplicitlyNull = rawBody && 'imageUrl' in rawBody && rawBody.imageUrl === null

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

      // Aceita formato ISO (YYYY-MM-DD) ou dd-MM-yyyy
      let parsedStartDate: Date | undefined
      let parsedEndDate: Date | undefined
      
      if (data.startDate) {
        // Verifica se é formato ISO válido (YYYY-MM-DD)
        const isoRegex = /^\d{4}-\d{2}-\d{2}/
        const isISOStart = isoRegex.test(data.startDate)
        
        if (isISOStart) {
          // Formato ISO: YYYY-MM-DD
          parsedStartDate = new Date(data.startDate)
          if (isNaN(parsedStartDate.getTime())) {
            throw new Error('Data de início inválida (formato ISO)')
          }
        } else {
          // Formato brasileiro: dd-MM-yyyy
          try {
            parsedStartDate = parse(data.startDate.trim(), 'dd-MM-yyyy', new Date())
            if (isNaN(parsedStartDate.getTime())) {
              throw new Error('Data de início inválida (formato dd-MM-yyyy)')
            }
          } catch (error) {
            throw new Error(`Data de início inválida: ${data.startDate}. Use formato dd-MM-yyyy`)
          }
        }
      }
      
      if (data.endDate) {
        // Verifica se é formato ISO válido (YYYY-MM-DD)
        const isoRegex = /^\d{4}-\d{2}-\d{2}/
        const isISOEnd = isoRegex.test(data.endDate)
        
        if (isISOEnd) {
          // Formato ISO: YYYY-MM-DD
          parsedEndDate = new Date(data.endDate)
          if (isNaN(parsedEndDate.getTime())) {
            throw new Error('Data de fim inválida (formato ISO)')
          }
        } else {
          // Formato brasileiro: dd-MM-yyyy
          try {
            parsedEndDate = parse(data.endDate.trim(), 'dd-MM-yyyy', new Date())
            if (isNaN(parsedEndDate.getTime())) {
              throw new Error('Data de fim inválida (formato dd-MM-yyyy)')
            }
          } catch (error) {
            throw new Error(`Data de fim inválida: ${data.endDate}. Use formato dd-MM-yyyy`)
          }
        }
      }

      // Preparar objeto de atualização
      const updateData: any = {
        title: data.title,
        startDate: parsedStartDate && isValid(parsedStartDate) ? parsedStartDate : undefined,
        endDate: parsedEndDate && isValid(parsedEndDate) ? parsedEndDate : undefined,
        time: data.time,
        location: data.location,
        description: data.description,
        hasDonation: data.hasDonation ?? false,
        donationReason: data.hasDonation ? data.donationReason : null,
        donationLink: data.hasDonation ? data.donationLink : null,
      }

      // Tratar imageUrl: se foi explicitamente null, definir como null; se foi enviado, usar o valor; caso contrário, não incluir
      if (imageUrlWasExplicitlyNull) {
        updateData.imageUrl = null
      } else if (data.imageUrl !== undefined) {
        updateData.imageUrl = data.imageUrl
      }
      // Se imageUrl não foi enviado (undefined), não incluir no update (mantém o valor atual)

      const updated = await prisma.event.update({
        where: { id },
        data: updateData,
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

  app.delete(
    '/:id',
    {
      preHandler: [
        authenticate,
        // checkPermission já verifica se é ADMINGERAL/ADMINFILIAL (têm todas as permissões)
        // ou se tem a permissão events_manage específica
        checkPermission(['events_manage']),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = eventIdParamSchema.params.parse(request.params)
        const user = request.user

        if (!user?.branchId) {
          return reply.status(400).send({ 
            message: 'Usuário não está associado a uma filial. Não é possível excluir eventos.' 
          })
        }

        // Verifica se o evento existe e pertence à filial do usuário
        const event = await prisma.event.findUnique({
          where: { id },
          include: {
            Branch: {
              select: { id: true, churchId: true },
            },
          },
        })

        if (!event) {
          return reply.status(404).send({ message: 'Evento não encontrado' })
        }

        // Verifica se o evento pertence à filial do usuário
        if (event.branchId !== user.branchId) {
          return reply.status(403).send({ message: 'Você não tem permissão para excluir este evento' })
        }

        // Exclui o evento
        await prisma.event.delete({
          where: { id },
        })

        return reply.status(200).send({ message: 'Evento excluído com sucesso' })
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
        console.error('❌ Erro ao excluir evento:', error)
        return reply.status(500).send({ error: 'Erro interno ao excluir evento', details: error.message })
      }
    }
  )
}

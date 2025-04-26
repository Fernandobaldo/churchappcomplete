// src/routes/contributionsRoutes.ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function contributionsRoutes(app: FastifyInstance) {
    // Criar nova contribuição
    app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            description: z.string(),
            date: z.string(),
            type: z.string(),
            value: z.number()
        })
        console.log('Corpo da requisição:', request.body)
        const { title, description, value, date, type } = bodySchema.parse(request.body)

        const user = request.user

        const contribution = await prisma.contribution.create({
            data: {
                title,
                description,
                value,
                date: new Date(date),
                type,
                branchId: user.branchId,
            },
        })

        return reply.code(201).send(contribution)
    })

    // Listar contribuições
    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user

        const contributions = await prisma.contribution.findMany({
            where: {
                branchId: user.branchId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return reply.send(contributions)
    })

    // Listar tipos de contribuição disponíveis
    app.get('/types', { preHandler: [app.authenticate] }, async (request, reply) => {
        const types = [
            { label: 'Dízimo', value: 'DIZIMO' },
            { label: 'Oferta', value: 'OFERTA' },
            { label: 'Outro', value: 'OUTRO' },
        ]

        return reply.send(types)
    })

}

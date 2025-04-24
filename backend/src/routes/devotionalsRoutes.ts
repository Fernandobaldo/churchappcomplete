import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

export async function devotionalsRoutes(app: FastifyInstance) {
    app.get('/devotionals', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user

        const devotionals = await prisma.devotional.findMany({
            where: {
                branchId: user.branchId,
            },
            orderBy: {
                date: 'desc',
            },
        })

        return reply.send(devotionals)
    })
    app.post('/devotionals', { preHandler: [app.authenticate] }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            passage: z.string(),
            content: z.string(),
            author: z.string(),
            date: z.string(), // formato ISO
        })

        const { title, passage, content, author, date } = bodySchema.parse(request.body)

        const devotional = await prisma.devotional.create({
            data: {
                title,
                passage,
                content,
                author,
                date: new Date(date),
                branchId: request.user.branchId,
            },
        })

        return reply.code(201).send(devotional)
    })

}

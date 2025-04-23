import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function eventsRoutes(app: FastifyInstance) {
    app.post('/events', { preHandler: [app.authenticate] }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            description: z.string().optional(),
            date: z.string(), // ISO string
            time: z.string(),
            location: z.string(),
            hasDonation: z.boolean(),
            donationLink: z.string().optional(),
            donationReason: z.string().optional(),
        })

        const {
            title,
            description,
            date,
            time,
            location,
            hasDonation,
            donationLink,
            donationReason,
        } = bodySchema.parse(request.body)

        const user = request.user

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                time,
                location,
                hasDonation,
                donationLink,
                donationReason,
                branchId: user.branchId,
            },
        })

        return reply.code(201).send(event)
    })
}

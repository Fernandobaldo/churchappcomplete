import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function membersRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user as any

        const members = await prisma.member.findMany({
            where: { branchId: user.branchId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                permissions: true,
            },
        })

        return members
    })
}

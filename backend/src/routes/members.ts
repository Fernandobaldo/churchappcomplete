import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import {z} from "zod";

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

    app.post('/:id/permissions', {preHandler: [app.authenticate]}, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().cuid(),
        })

        const bodySchema = z.object({
            permissions: z.array(z.string()),
        })

        const {id} = paramsSchema.parse(request.params)
        const {permissions} = bodySchema.parse(request.body)

        // Remove permissões anteriores (opcional)
        await prisma.permission.deleteMany({
            where: {memberId: id},
        })

        // Cria novas permissões
        await prisma.permission.createMany({
            data: permissions.map((type) => ({
                memberId: id,
                type,
            })),
        })

        return reply.send({success: true})
    })
}
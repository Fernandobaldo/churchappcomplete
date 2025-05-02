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
                branchId: true,
                email: true,
                role: true,
                permissions: {
                    select: {
                        type: true,
                    },
                }
            },
        })

        return members
    })

    app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const userId = request.user.sub;

        const user = await prisma.member.findUnique({
            where: { id: userId },
            include: {
                permissions: true,
                branch: {
                    include: {
                        church: true,
                    },
                },
            },
        });

        if (!user) {
            return reply.code(404).send({ message: 'Usuário não encontrado' });
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions.map((p) => ({ type: p.type })),
            branch: {
                id: user.branch.id,
                name: user.branch.name,
            },
            church: {
                id: user.branch.church.id,
                name: user.branch.church.name,
                logoUrl: user.branch.church.logoUrl,
            },
        };
    });

}
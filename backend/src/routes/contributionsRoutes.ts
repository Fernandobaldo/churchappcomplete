import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ContributionType } from '@prisma/client';
import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';

export async function contributionsRoutes(app: FastifyInstance) {
    app.get('/contributions', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user;

        const contributions = await prisma.contribution.findMany({
            where: {
                branchId: user.branchId,
            },
            orderBy: {
                date: 'desc',
            },
        });

        return reply.send(contributions);
    });

    app.post('/contributions', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['contribution_manage'])
        ]
    }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            description: z.string().optional(),
            value: z.number(),
            date: z.string(),
            type: z.nativeEnum(ContributionType),
        });

        const { title, description, value, date, type } = bodySchema.parse(request.body);
        const user = request.user;

        const contribution = await prisma.contribution.create({
            data: {
                title,
                description,
                value,
                date: new Date(date),
                type,
                branchId: user.branchId,
            },
        });

        return reply.code(201).send(contribution);
    });
}

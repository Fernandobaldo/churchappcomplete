import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ContributionType } from '@prisma/client';
import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';
import { createContributionSchema } from '../schemas/contributionSchemas.js';

export async function contributionsRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
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

    app.post('/', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['contribution_manage'])
        ],
        schema: createContributionSchema
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

    app.get('/types', async (request, reply) => {
        return [
            { label: 'Dízimo', value: 'DIZIMO' },
            { label: 'Oferta', value: 'OFERTA' },
            { label: 'Outro', value: 'OUTRO' },
        ]
    })

}

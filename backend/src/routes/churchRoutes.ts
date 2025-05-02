import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createChurchSchema } from '../schemas/churchSchemas.js';

export async function churchRoutes(app: FastifyInstance) {
    // Cria a igreja (e opcionalmente a filial)
    app.post('/churches', {
        preHandler: [app.authenticate],
        schema: createChurchSchema,  //
    }, async (request, reply) => { bodySchema = z.object({
            name: z.string(),
            logoUrl: z.string().url().optional(),
            withBranch: z.boolean().optional(),
            branchName: z.string().optional(),
            pastorName: z.string().optional()
        });

        const { name, logoUrl, withBranch, branchName, pastorName } = bodySchema.parse(request.body);

        const church = await prisma.church.create({
            data: {
                name,
                logoUrl,
            },
        });

        let branch = null;

        if (withBranch && branchName && pastorName) {
            branch = await prisma.branch.create({
                data: {
                    name: branchName,
                    pastorName,
                    churchId: church.id,
                },
            });
        }

        return reply.code(201).send({ church, branch });
    });

    // Lista igrejas
    app.get('/churches', { preHandler: [app.authenticate] }, async (request, reply) => {
        const churches = await prisma.church.findMany({
            include: { branches: true },
        });

        return reply.send(churches);
    });


    // Get one by ID
    app.get('/churches/:id',{ preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().cuid(),
        });

        const { id } = paramsSchema.parse(request.params);

        const church = await prisma.church.findUnique({
            where: { id },
        });

        if (!church) {
            return reply.code(404).send({ message: 'Igreja não encontrada.' });
        }

        return reply.send(church);
    });

    // Update
    app.put('/churches/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({ id: z.string().cuid() });
        const bodySchema = z.object({
            name: z.string(),
            logoUrl: z.string().url().optional(),
            withBranch: z.boolean().optional(),
            branchName: z.string().optional(),
            pastorName: z.string().optional()
        });

        const { id } = paramsSchema.parse(request.params);
        const data = bodySchema.parse(request.body);

        const church = await prisma.church.update({
            where: { id },
            data,
        });

        return reply.send(church);
    });

    // Delete
    app.delete('/churches/:id', async (request, reply) => {
        const paramsSchema = z.object({ id: z.string().cuid() });
        const { id } = paramsSchema.parse(request.params);

        await prisma.church.delete({
            where: { id },
        });

        return reply.code(204).send();
    });



}

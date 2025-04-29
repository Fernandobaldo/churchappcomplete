import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function churchRoutes(app: FastifyInstance) {
    // Cria a igreja (e opcionalmente a filial)
    app.post('/churches', { preHandler: [app.authenticate] }, async (request, reply) => {
        const bodySchema = z.object({
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
}

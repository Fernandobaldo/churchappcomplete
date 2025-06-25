import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {PrismaClient} from "@prisma/client";
import { createBranchSchema } from '../schemas/branchSchemas.js';
const prisma = new PrismaClient()


export async function branchesRoutes(app: FastifyInstance) {
    app.post('/', {
        preHandler: [app.authenticate],
            schema: createBranchSchema},
        async (request, reply) => {
        const bodySchema = z.object({
            name: z.string(),
            pastorName: z.string(),
            churchId: z.string(),
        });

        const { name, pastorName, churchId } = bodySchema.parse(request.body);

        const branch = await prisma.branch.create({
            data: {
                name,
                pastorName,
                churchId,
            },
        });

        return reply.code(201).send(branch);
    });

    app.get('/branches', { preHandler: [app.authenticate] }, async (request, reply) => {
        const branches = await prisma.branch.findMany({
            include: {
                church: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return reply.send(branches);
    });

    app.get('/branches/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string(),
        });

        const { id } = paramsSchema.parse(request.params);

        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                church: true,
            },
        });

        if (!branch) {
            return reply.code(404).send({ message: 'Branch não encontrada.' });
        }

        return reply.send(branch);
    });
}

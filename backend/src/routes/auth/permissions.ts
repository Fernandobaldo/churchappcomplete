import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import {checkRole, isAdminGeral} from '../../middlewares/checkRole';

export async function permissionsRoutes(app: FastifyInstance) {
    // 🔐 Lista de todas as permissões disponíveis
    app.get('/all', {
        preHandler: [app.authenticate, checkRole],
    }, async (request, reply) => {
        const permissions = await prisma.permission.findMany({
            select: { type: true },
            distinct: ['type'],
        });

        return permissions;
    });

    // 🔐 Adiciona novas permissões a um membro (sem apagar as existentes)
    app.post('/:id', {
        preHandler: [app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),],

    }, async (request, reply) => {
        const paramsSchema = z.object({ id: z.string().cuid() });
        const bodySchema = z.object({
            permissions: z.array(z.string()).min(1),
        });

        const { id } = paramsSchema.parse(request.params);
        const { permissions } = bodySchema.parse(request.body);

        const result = await prisma.permission.createMany({
            data: permissions.map((type) => ({ memberId: id, type })),
            skipDuplicates: true, // ← evita duplicatas
        });

        return reply.send({
            success: true,
            added: result.count,
        });
    });
}

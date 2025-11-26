import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuditLogger } from '../../utils/auditHelper';
// 🔍 Listar todas as permissões
export async function getAllPermissionsController(request, reply) {
    const permissions = await prisma.permission.findMany({
        select: { type: true },
        distinct: ['type'],
    });
    return reply.send(permissions);
}
// ✅ Atribuir permissões a um membro
export async function assignPermissionsController(request, reply) {
    const paramsSchema = z.object({ id: z.string().cuid() });
    const bodySchema = z.object({
        permissions: z.array(z.string()).min(1),
    });
    const { id } = paramsSchema.parse(request.params);
    const { permissions } = bodySchema.parse(request.body);
    const result = await prisma.permission.createMany({
        data: permissions.map((type) => ({
            memberId: id,
            type,
        })),
        skipDuplicates: true,
    });
    // Log de auditoria
    await AuditLogger.memberPermissionsChanged(request, id, permissions);
    return reply.send({
        success: true,
        added: result.count,
    });
}

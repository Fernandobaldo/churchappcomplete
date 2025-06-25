import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { registerSchema } from '../../schemas/authSchemas';
import { ALL_PERMISSION_TYPES } from '../../constants/permissions';


export async function registerRoute(app: FastifyInstance) {
    app.post('/', { schema: registerSchema }, async (request, reply) => {
        const bodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6),
            branchId: z.string().optional(),
            role: z.nativeEnum(Role).optional(),
            permissions: z.array(z.string()).optional(),
            birthDate: z.string().optional(), // ISO format
            phone: z.string().optional(),
            address: z.string().optional(),
            avatarUrl: z.string().url().optional(),
        });

        const {
            name,
            email,
            password,
            branchId,
            role,
            permissions,
            birthDate,
            phone,
            address,
            avatarUrl,
        } = bodySchema.parse(request.body);
        const hashedPassword = await bcrypt.hash(password, 10);

        let finalRole = role;

        if (!finalRole) {
            const churchesCount = await prisma.church.count();
            finalRole = churchesCount === 0 ? Role.ADMINGERAL : Role.ADMINFILIAL;
        }

        const user = await prisma.member.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: finalRole,
                branchId,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                phone,
                address,
                avatarUrl,
            },
        });


        if (finalRole === Role.ADMINGERAL || finalRole === Role.ADMINFILIAL) {
            const allPermissions = await prisma.permission.findMany({
                where: { type: { in: ALL_PERMISSION_TYPES } },
            });

            await prisma.member.update({
                where: { id: user.id },
                data: {
                    permissions: {
                        connect: allPermissions.map((p) => ({ id: p.id })),
                    },
                },
            });
        } else if (permissions && permissions.length > 0) {
            const selectedPermissions = await prisma.permission.findMany({
                where: { type: { in: permissions } },
            });

            await prisma.member.update({
                where: { id: user.id },
                data: {
                    permissions: {
                        connect: selectedPermissions.map((p) => ({ id: p.id })),
                    },
                },
            });
        }

        const userWithPermissions = await prisma.member.findUnique({
            where: { id: user.id },
            include: { permissions: true },
        });

        return reply.send({
            user: {
                id: userWithPermissions?.id,
                name: userWithPermissions?.name,
                email: userWithPermissions?.email,
                role: userWithPermissions?.role,
                branchId: userWithPermissions?.branchId,
                birthDate: userWithPermissions?.birthDate,
                phone: userWithPermissions?.phone,
                address: userWithPermissions?.address,
                avatarUrl: userWithPermissions?.avatarUrl,
                permissions: userWithPermissions?.permissions.map((p) => ({ type: p.type })) || [],
            },
        });
    });
    app.get('/types', async (request, reply) => {
        return [
            { label: 'Admin Geral', value: 'ADMINGERAL' },
            { label: 'Admin Congregação', value: 'ADMINFILIAL' },
            { label: 'Membro', value: 'MEMBER' },
        ]
    })
}

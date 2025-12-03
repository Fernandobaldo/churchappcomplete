import { z } from 'zod';
export const memberIdParamSchema = z.object({
    id: z.string().cuid('ID inválido'),
});
export const updateMemberBodySchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    birthDate: z.string().nullable().optional().transform(val => val === '' || val === null ? null : val), // formato: 'dd/MM/yyyy' ou null para remover
    phone: z.string().nullable().optional().transform(val => val === '' || val === null ? null : val),
    address: z.string().nullable().optional().transform(val => val === '' || val === null ? null : val),
    avatarUrl: z.string().nullable().optional().transform(val => val === '' || val === null ? null : val),
    positionId: z.preprocess((val) => (val === '' || val === null ? null : val), z.string().cuid().nullable().optional()),
});
export const updateMemberRoleBodySchema = z.object({
    role: z.enum(['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL'], {
        errorMap: () => ({ message: 'Role inválida. Valores permitidos: MEMBER, COORDINATOR, ADMINFILIAL, ADMINGERAL' }),
    }),
});

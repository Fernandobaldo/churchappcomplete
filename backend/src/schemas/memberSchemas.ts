import { z } from 'zod'

export const memberIdParamSchema = z.object({
id: z.string().cuid('ID inválido'),
})

export const updateMemberBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  birthDate: z.string().optional(), // formato: 'dd/MM/yyyy'
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

export const updateMemberRoleBodySchema = z.object({
  role: z.enum(['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL'], {
    errorMap: () => ({ message: 'Role inválida. Valores permitidos: MEMBER, COORDINATOR, ADMINFILIAL, ADMINGERAL' }),
  }),
})
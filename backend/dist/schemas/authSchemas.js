// src/schemas/authSchemas.ts
import { z } from 'zod';
import { Role } from '@prisma/client';
// 📌 Login
export const loginBodySchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
});
export const loginSchema = {
    body: loginBodySchema,
};
// 📌 Registro
export const registerBodySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    branchId: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    permissions: z.array(z.string()).optional(),
    birthDate: z.string().optional(), // formato ISO ou dd/MM/yyyy
    phone: z.string().optional(),
    address: z.string().optional(),
    avatarUrl: z.string().url('URL do avatar inválida').optional(),
});
export const registerSchema = {
    body: registerBodySchema,
};

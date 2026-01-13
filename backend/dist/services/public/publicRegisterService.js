// src/services/public/publicRegisterService.ts
import { prisma } from '../../lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../../env';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// Garante que as variáveis de ambiente estão carregadas
dotenv.config();
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
}
export async function publicRegisterUserService(data) {
    const { firstName, lastName, email, password, phone, document } = data;
    // Verifica se o email já está em uso
    const emailAlreadyUsed = await prisma.user.findUnique({ where: { email } });
    if (emailAlreadyUsed) {
        throw new Error('Email já está em uso.');
    }
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    // Busca o plano gratuito (tenta diferentes variações do nome)
    let freePlan = await prisma.plan.findFirst({ where: { name: 'free' } });
    if (!freePlan) {
        freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
    }
    if (!freePlan) {
        freePlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } });
    }
    if (!freePlan) {
        throw new Error('Plano gratuito não encontrado. Execute o seed do banco de dados.');
    }
    // Cria o usuário e associa o plano
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            document,
            Subscription: {
                create: {
                    planId: freePlan.id,
                    status: SubscriptionStatus.active,
                },
            },
        },
    });
    // Gera o token JWT - combinar firstName e lastName para o campo name (compatibilidade)
    const fullName = `${firstName} ${lastName}`.trim();
    const token = jwt.sign({
        sub: user.id,
        email: user.email,
        name: fullName, // Usar nome completo para compatibilidade com JWT
        type: 'user',
        // Não inclui memberId, role, branchId, churchId quando não há Member
        // Isso indica que o onboarding não foi completado
        permissions: [],
    }, env.JWT_SECRET, {
        expiresIn: '7d',
    });
    return { user, token };
}

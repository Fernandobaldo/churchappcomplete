import { prisma } from '../../lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
export async function loginUserService(app, email, password) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            Subscription: {
                where: { status: SubscriptionStatus.active },
                include: { Plan: true },
            },
            Member: {
                include: { Permission: true }
            }
        }
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Credenciais inválidas');
    }
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        memberId: user.Member?.id ?? null,
        role: user.Member?.role ?? null,
        branchId: user.Member?.branchId ?? null,
        permissions: user.Member?.Permission.map((p) => p.type) ?? [],
    };
    const token = app.jwt.sign(tokenPayload, { sub: user.id, expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            plan: user.Subscription[0]?.Plan.name ?? 'free',
        },
        member: user.Member ? {
            id: user.Member.id,
            name: user.Member.name,
            role: user.Member.role,
            branchId: user.Member.branchId,
            permissions: user.Member.Permission.map((p) => p.type)
        } : null
    };
}

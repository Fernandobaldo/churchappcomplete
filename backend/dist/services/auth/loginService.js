import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
export async function loginUserService(app, email, password) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            subscriptions: {
                where: { status: 'active' },
                include: { plan: true },
            },
            member: {
                include: { permissions: true }
            }
        }
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Credenciais inválidas');
    }
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        memberId: user.member?.id ?? null,
        role: user.member?.role ?? null,
        branchId: user.member?.branchId ?? null,
        permissions: user.member?.permissions.map(p => p.type) ?? [],
    };
    const token = app.jwt.sign(tokenPayload, { sub: user.id, expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            plan: user.subscriptions[0]?.plan.name ?? 'free',
        },
        member: user.member ? {
            id: user.member.id,
            name: user.member.name,
            role: user.member.role,
            branchId: user.member.branchId,
            permissions: user.member.permissions.map(p => p.type)
        } : null
    };
}

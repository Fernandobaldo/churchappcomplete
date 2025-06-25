import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '../../schemas';
import { Role } from '@prisma/client';

export async function loginRoute(app: FastifyInstance) {
    app.post('/login', { schema: loginSchema }, async (request, reply) => {
        const bodySchema = z.object({
            email: z.string().email(),
            password: z.string(),
        });

        const { email, password } = bodySchema.parse(request.body);

        const user = await prisma.member.findUnique({
            where: { email },
            include: { permissions: true },
        });
        console.log('🔍 User do login:', JSON.stringify(user, null, 2));

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }
        console.log('🔑 LoginRoute foi executado!');

        const token = app.jwt.sign(
            {
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                permissions: user.permissions.map((p) => p.type),
            },
            { sub: user.id, expiresIn: '7d' }
        );
        const responsePayload = {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                permissions: [...user.permissions].map(p => ({ type: p.type })),
            },
        };

        console.log('🧪 Testando JSON.stringify do payload:');
        console.log(JSON.stringify(responsePayload, null, 2));

        return reply.send(responsePayload);
    });
}

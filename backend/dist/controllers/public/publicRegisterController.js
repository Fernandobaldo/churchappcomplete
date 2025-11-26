import { z } from 'zod';
import { publicRegisterUserService } from '../../services/public/publicRegisterService';
export async function publicRegisterController(request, reply) {
    const bodySchema = z.object({
        name: z.string().min(1, 'Nome obrigatório'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    });
    const data = bodySchema.parse(request.body);
    const result = await publicRegisterUserService(data);
    return reply.status(201).send({
        user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
        },
        token: result.token,
    });
}

import { z } from 'zod';
import { createDevotionalSchema } from '../schemas/devotionalSchemas';
import { DevotionalService } from '../services/devotionalService';
export class DevotionalController {
    constructor() {
        this.service = new DevotionalService();
    }
    async getAll(request, reply) {
        const user = request.user;
        if (!user?.branchId) {
            return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' });
        }
        const result = await this.service.getAll(user.sub || user.id, user.branchId);
        return reply.send(result);
    }
    async create(request, reply) {
        const data = createDevotionalSchema.body.parse(request.body);
        const user = request.user;
        if (!user.branchId) {
            return reply.code(400).send({ message: 'Usuário não vinculado a uma filial.' });
        }
        const devotional = await this.service.create({
            ...data,
            authorId: user.sub,
            branchId: user.branchId,
        });
        return reply.code(201).send(devotional);
    }
    async like(request, reply) {
        const paramsSchema = z.object({ id: z.string().cuid() });
        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;
        try {
            await this.service.like(id, userId);
        }
        catch {
            return reply.code(400).send({ message: 'Você já curtiu esse devocional.' });
        }
        return reply.send({ success: true });
    }
    async unlike(request, reply) {
        const paramsSchema = z.object({ id: z.string().cuid() });
        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;
        await this.service.unlike(id, userId);
        return reply.send({ success: true });
    }
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';
import { createDevotionalSchema } from '../schemas/devotionalSchemas.js';
import {createEventSchema} from "../schemas";

export async function devotionalsRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user;

        const devotionals = await prisma.devotional.findMany({
            where: {
                branchId: user.branchId,
            },
            include: {
                author: true,
                likes: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        const result = devotionals.map(dev => ({
            ...dev,
            likesCount: dev.likes.length,
            liked: dev.likes.some(like => like.userId === user.sub),
        }));

        return reply.send(result);
    });

    app.post('/', {
        schema: createEventSchema,
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['events_manage']),
        ],
        schema: createDevotionalSchema
    }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            passage: z.string(),
            content: z.string().optional(),
        });

        const { title, passage, content } = bodySchema.parse(request.body);
        const user = request.user;

        if (!user.branchId) {
            return reply.code(400).send({ message: 'Usuário não vinculado a uma filial.' });
        }

        const devotional = await prisma.devotional.create({
            data: {
                title,
                passage,
                content,
                authorId: user.sub,
                branchId: user.branchId,
            },
        });

        return reply.code(201).send(devotional);
    });

    app.post('/:id/like', { preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().cuid(),
        });

        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;

        try {
            await prisma.devotionalLike.create({
                data: {
                    devotionalId: id,
                    userId,
                },
            });
        } catch (err) {
            return reply.code(400).send({ message: 'Você já curtiu esse devocional.' });
        }

        return reply.send({ success: true });
    });

    app.delete('/:id/unlike', { preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({ id: z.string().cuid() });

        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;

        await prisma.devotionalLike.deleteMany({
            where: {
                devotionalId: id,
                userId,
            },
        });

        return reply.send({ success: true });
    });
}

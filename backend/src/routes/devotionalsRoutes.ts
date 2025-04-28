import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

export async function devotionalsRoutes(app: FastifyInstance) {
    app.get('/devotionals', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user

        const devotionals = await prisma.devotional.findMany({
            where: {
                branchId: user.branchId,
            },
            orderBy: {
                date: 'desc',
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,  // 👈 seleciona o nome do autor
                    },
                },
                Branch: true,
            },
        })

        return reply.send(devotionals)
    })
    app.post('/devotionals', { preHandler: [app.authenticate] }, async (request, reply) => {
        const bodySchema = z.object({
            title: z.string(),
            passage: z.string(),
            content: z.string().optional(),
        });

        const { title, passage, content } = bodySchema.parse(request.body);

        const user = request.user;

        if (!user.branchId) {
            return reply.code(400).send({ message: 'User is not linked to a branch.' });
        }

        const devotional = await prisma.devotional.create({
            data: {
                title,
                passage,
                content,
                authorId: user.sub,    // ID do Member logado
                branchId: user.branchId, // ID da Branch do Member logado
            },
            include: {
                author: true,
                Branch: true,
            }
        });

        return reply.code(201).send(devotional);
    });


    app.post('/devotionals/:id/like', { preHandler: [app.authenticate] }, async (request, reply) => {
        const devotionalId = request.params.id;
        const userId = request.user.sub;

        // Verificar se já existe o like
        const existingLike = await prisma.devotionalLike.findFirst({
            where: {
                devotionalId,
                userId,
            },
        });

        if (existingLike) {
            // Já curtiu, podemos retornar sucesso direto
            return reply.code(200).send({ message: 'Você já curtiu este devocional.' });
        }

        // Se não curtiu ainda, cria o like
        await prisma.devotionalLike.create({
            data: {
                devotionalId,
                userId,
            },
        });

        return reply.code(201).send();
    });

    app.delete('/devotionals/:id/unlike', { preHandler: [app.authenticate] }, async (request, reply) => {
        const devotionalId = request.params.id
        const userId = request.user.sub

        await prisma.devotionalLike.deleteMany({
            where: { devotionalId, userId }
        })

        return reply.code(200).send({ success: true })
    })




}

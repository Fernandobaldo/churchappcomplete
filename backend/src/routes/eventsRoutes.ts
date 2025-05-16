import { FastifyInstance } from 'fastify';
import {isValid, z} from 'zod';
import { prisma } from '../lib/prisma';
import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';
import { createEventSchema } from '../schemas';
import {parse} from "date-fns";
export async function eventsRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user;

        const events = await prisma.event.findMany({
            where: {
                branchId: user.branchId,
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        return reply.send(events);
    });

    app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const event = await prisma.event.findUnique({
                where: { id },
                include: {
                    branch: {
                        select: {
                            name: true,
                            churchId: true,
                        },
                    },
                },
            });

            if (!event) {
                return reply.status(404).send({ message: 'Evento não encontrado' });
            }

            return reply.send(event);
        } catch (error) {
            console.error('Erro ao buscar evento:', error);
            return reply.status(500).send({ message: 'Erro interno ao buscar evento' });
        }
    });

    app.post(
        '/',
        {
            schema: createEventSchema,
            preHandler: [
                app.authenticate,
                checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']) ||
                checkPermission(['events_manage']),
            ],
        },
        async (request, reply) => {
            const bodySchema = z.object({
                title: z.string().min(1, 'Título obrigatório'),
                startDate: z.string(),
                endDate: z.string(),
                time: z.string().optional(),
                location: z.string().optional(),
                description: z.string().optional(),
                hasDonation: z.boolean().optional(),
                donationReason: z.string().optional(),
                donationLink: z.string().optional(),
                imageUrl: z.string().url().optional(),
            });

            const data = bodySchema.parse(request.body)

            const parsedStartDate = parse(data.startDate.trim(), 'dd-MM-yyyy', new Date());
            const parsedEndDate = parse(data.endDate.trim(), 'dd-MM-yyyy', new Date());
            const user = request.user;
            const newEvent = await prisma.event.create({
                data: {
                    title: data.title,
                    startDate: parsedStartDate,
                    endDate: parsedEndDate,
                    time: data.time,
                    location: data.location,
                    description: data.description,
                    hasDonation: data.hasDonation ?? false,
                    donationReason: data.donationReason,
                    donationLink: data.donationLink,
                    branchId: user.branchId,
                    imageUrl: data.imageUrl,
                },
            });

            return reply.status(201).send(newEvent)
        }
    );

    app.put('/:id', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']) ||
            checkPermission(['events_manage']),
        ]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const user = request.user
        const data = request.body as {
            title?: string
            startDate?: string
            endDate?: string
            time?: string
            location?: string
            description?: string
            hasDonation?: boolean
            donationReason?: string | null
            donationLink?: string | null


        }

        try {
            const existing = await prisma.event.findUnique({
                where: { id },
                include: {
                    branch: {
                        select: { id: true, churchId: true },
                    },
                },
            })

            if (!existing || !existing.branch?.churchId) {
                return reply.status(404).send({ message: 'Evento ou filial associada não encontrada.' })
            }

            const parsedStartDate = data.startDate
                ? parse(data.startDate.trim(), 'dd/MM/yyyy', new Date())
                : undefined

            const parsedEndDate = data.endDate
                ? parse(data.endDate.trim(), 'dd/MM/yyyy', new Date())
                : undefined

            const updated = await prisma.event.update({
                where: { id },
                data: {
                    title: data.title,
                    startDate: isValid(parsedStartDate) ? parsedStartDate : undefined,
                    endDate: isValid(parsedEndDate) ? parsedEndDate : undefined,
                    time: data.time,
                    location: data.location,
                    description: data.description,
                    hasDonation: data.hasDonation ?? false,
                    donationReason: data.hasDonation ? data.donationReason : null,
                    donationLink: data.hasDonation ? data.donationLink : null,
                },
            })

            return reply.send(updated)
        } catch (error) {
            console.error('Erro ao atualizar evento:', error)
            return reply.status(500).send({ message: 'Erro interno ao atualizar o evento.' })
        }
    })


}

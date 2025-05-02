import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';
import { createEventSchema } from '../schemas/eventSchemas.js';
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

    app.post(
        '/',
        {
            schema: createEventSchema,
            preHandler: [
                app.authenticate,
                checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
                checkPermission(['events_manage']),
            ],
        },
        async (request, reply) => {
            const bodySchema = z.object({
                title: z.string(),
                description: z.string().optional(),
                startDate: z.string(),
                endDate: z.string(),
                time: z.string(),
                location: z.string(),
                hasDonation: z.boolean().optional(),
                donationLink: z.string().optional(),
                donationReason: z.string().optional(),
            });

            const {
                title,
                description,
                startDate,
                endDate,
                time,
                location,
                hasDonation,
                donationLink,
                donationReason,
            } = bodySchema.parse(request.body);

            const user = request.user;

            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    time,
                    location,
                    hasDonation: hasDonation ?? false,
                    donationLink,
                    donationReason,
                    branchId: user.branchId,
                },
            });

            return reply.code(201).send(event);
        }
    );

}

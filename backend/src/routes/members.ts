import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import {z} from "zod";
import { parse } from 'date-fns'

const prisma = new PrismaClient()

export async function membersRoutes(app: FastifyInstance) {

    function formatDate(date?: Date | null): string | null {
        if (!date) return null
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date)
    }

    app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const user = request.user as any

        const members = await prisma.member.findMany({
            where: { branchId: user.branchId },
            select: {
                id: true,
                name: true,
                branchId: true,
                birthDate: true,
                phone: true,
                address: true,
                avatarUrl: true,
                email: true,
                role: true,
                permissions: {
                    select: {
                        type: true,
                    },
                }
            },
        })

        return members
    })
    app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string }

        const members = await prisma.member.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                branchId: true,
                birthDate: true,
                phone: true,
                address: true,
                avatarUrl: true,
                email: true,
                role: true,
                permissions: {
                    select: {
                        type: true,
                    },
                },
            branch: {
                include: {
                    church: true,
                }
            }
            },
        })
        if (!members) {
            return reply.code(404).send({ message: 'Membro não encontrado' })
        }

        return reply.send({
            ...members,
            birthDate: formatDate(members.birthDate),
        })
    })

    app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const userId = request.user.sub;

        const user = await prisma.member.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                branchId: true,
                birthDate: true,
                phone: true,
                address: true,
                avatarUrl: true,
                email: true,
                role: true,
                permissions: {
                    select: {
                        type: true,
                    },
                },
                branch: {
                    include: {
                        church: true,
                    }
                }
            }
        });

        if (!user) {
            return reply.code(404).send({ message: 'Usuário não encontrado' });
        }

        return reply.send({
            ...user,
            birthDate: formatDate(user.birthDate),
        })
    });

    // PUT /members/:id → Atualiza nome e email do membro
    app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().cuid(),
        })

        const bodySchema = z.object({
            name: z.string().min(1).optional(),
            email: z.string().email().optional(),
            birthDate: z.string().optional(), // ISO format esperado
            phone: z.string().optional(),
            address: z.string().optional(),
            avatarUrl: z.string().url().optional(),
        })

        const { id } = paramsSchema.parse(request.params)
        const { name, email, birthDate, phone, address, avatarUrl } = bodySchema.parse(request.body)

        const dataToUpdate: any = {}
        if (name) dataToUpdate.name = name
        if (email) dataToUpdate.email = email
        if (birthDate) {
            const parsedDate = parse(birthDate, 'dd/MM/yyyy', new Date())
            if (isNaN(parsedDate.getTime())) {
                return reply.status(400).send({ message: 'Data de nascimento inválida.' })
            }
            dataToUpdate.birthDate = parsedDate
        }
        if (phone) dataToUpdate.phone = phone
        if (address) dataToUpdate.address = address
        if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl

        if (Object.keys(dataToUpdate).length === 0) {
            return reply.status(400).send({ message: 'Nenhum dado para atualizar.' })
        }

        const updated = await prisma.member.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                birthDate: true,
                phone: true,
                address: true,
                avatarUrl: true,
            },
        })

        return reply.send(updated)
    })




    // app.get('/:branchId', { preHandler: [app.authenticate] }, async (request, reply) => {
    //     const { branchId } = request.params as { branchId: string }
    //
    //
    //     const members = await prisma.member.findMany({
    //         where: { branchId: user.branchId },
    //         select: {
    //             id: true,
    //             name: true,
    //             branchId: true,
    //             email: true,
    //             role: true,
    //             permissions: {
    //                 select: {
    //                     type: true,
    //                 },
    //             }
    //         },
    //     })
    //
    //     return members
    // })

}
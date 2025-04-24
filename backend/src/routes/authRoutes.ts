import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function authRoutes(app: FastifyInstance) {
    app.post('/register', async (request, reply) => {
        const bodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6),
            branchId: z.string(),
        })

        const { name, email, password, branchId } = bodySchema.parse(request.body)

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.member.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'MEMBER',
                branchId,
            },
        })

        return reply.send({ user })
    })

    app.post('/login', async (request, reply) => {
        const bodySchema = z.object({
            email: z.string().email(),
            password: z.string(),
        })

        const { email, password } = bodySchema.parse(request.body)

        const user = await prisma.member.findUnique({ where: { email } })

        const senhaValida = await bcrypt.compare(password, user.password)


        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.code(401).send({ message: 'Invalid credentials' })
        }

        const token = app.jwt.sign(
            {
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
            },
            { sub: user.id, expiresIn: '7d' }
        )

        return { token, user }
    })
}

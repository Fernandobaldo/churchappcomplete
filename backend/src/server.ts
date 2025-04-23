import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './routes/authRoutes'
import { membersRoutes } from './routes/members'
import { eventsRoutes } from './routes/eventsRoutes'


const prisma = new PrismaClient()
const app = Fastify()

app.register(cors, {
    origin: true,
})

app.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
})

// Tipagem do decorator
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
    }
}

app.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.code(401).send({ message: 'Unauthorized' })
    }
})

// Rotas protegidas
app.register(authRoutes, { prefix: '/auth' })
app.register(membersRoutes, { prefix: '/members' })
app.register(eventsRoutes, { prefix: '/events' })


// Rota pública
app.get('/', async () => {
    return { status: 'Church App API running' }
})

app.listen({ port: 3333 }, () => {
    console.log('✅ Server running at http://localhost:3333')
})

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { prisma } from './lib/prisma.js';
import { registerRoutes } from './routes/index.js';

const app = fastify({ logger: true });

app.register(fastifyCors, { origin: true });

app.register(fastifyJwt, {
    secret: 'churchapp-secret-key',
});

app.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.send(err);
    }
});

// Registra todas rotas de forma organizada
await registerRoutes(app);

app.listen({ port: 3333, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 Server running at ${address}`);
});

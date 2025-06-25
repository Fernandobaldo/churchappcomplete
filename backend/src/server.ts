import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { prisma } from './lib/prisma.js';
import { registerRoutes } from './routes/registerRoutes';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
dotenv.config();
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

app.register(fastifySwagger, {
    swagger: {
        info: {
            title: 'Church App API',
            description: 'Documentação da API do sistema de igrejas',
            version: '1.0.0',
        },
        host: 'http://192.168.1.13:3333',

        securityDefinitions: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        security: [{ bearerAuth: [] }],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
});

app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    exposeRoute: true,
});

await registerRoutes(app);

app.listen({ port: 3333, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 Server running at ${address}`);
});

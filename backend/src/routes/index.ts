import { FastifyInstance } from 'fastify';
import { authRoutes } from './authRoutes.js';
import { branchesRoutes } from './branchRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { membersRoutes } from './members.js';
import { eventsRoutes } from './eventsRoutes.js';
import { contributionsRoutes } from './contributionsRoutes.js';
import { devotionalsRoutes } from './devotionalsRoutes.js';
// Se tiver noticesRoutes.ts também importa aqui futuramente!

export async function registerRoutes(app: FastifyInstance) {
    app.register(authRoutes, { prefix: '/auth' });
    app.register(branchesRoutes, { prefix: '/branches' });
    app.register(churchRoutes, { prefix: '/churches' });
    app.register(membersRoutes, { prefix: '/members' });
    app.register(eventsRoutes, { prefix: '/events' });
    app.register(contributionsRoutes, { prefix: '/contributions' });
    app.register(devotionalsRoutes, { prefix: '/devotionals' });
    // app.register(noticesRoutes, { prefix: '/notices' }); (se quiser adicionar depois)
}

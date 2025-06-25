import { FastifyInstance } from 'fastify';

import { branchesRoutes } from './branchRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { membersRoutes } from './members.js';
import { eventsRoutes } from './eventsRoutes.js';
import { contributionsRoutes } from './contributionsRoutes.js';
import { devotionalsRoutes } from './devotionalsRoutes.js';
import { authRoutes } from './auth';
import { permissionsRoutes } from './auth/permissions'
import { registerRoute } from './auth/register'



    export async function registerRoutes(app: FastifyInstance) {
        app.register(authRoutes, { prefix: '/auth' });
        app.register(branchesRoutes, { prefix: '/branches' });
        app.register(churchRoutes, { prefix: '/churches' });
        app.register(membersRoutes, { prefix: '/members' });
        app.register(eventsRoutes, { prefix: '/events' });
        app.register(contributionsRoutes, { prefix: '/contributions' });
        app.register(devotionalsRoutes, { prefix: '/devotionals' });
        app.register(permissionsRoutes, { prefix: '/permissions' });
        app.register(registerRoute, { prefix: '/register' });


}

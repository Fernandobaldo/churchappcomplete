import { FastifyInstance } from 'fastify';

import { branchesRoutes } from './branchRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { membersRoutes } from './membersRoutes.js';
import { eventsRoutes } from './eventsRoutes.js';
import { contributionsRoutes } from './contributionsRoutes.js';
import { devotionalsRoutes } from './devotionalsRoutes.js';
import { authRoutes } from './auth';
import { permissionsRoutes } from './auth/permissions'
import { registerRoute } from './auth/register'
import { planRoutes } from './planRoutes';
import { subscriptionRoutes } from './subscriptionRoutes';
import { adminRoutes } from './adminRoutes';
import { publicRegisterRoute } from './public/register'
import { loginRoute } from './auth/login'
import { authenticate } from '../middlewares/authenticate'
import { auditRoutes } from './auditRoutes'
import { noticesRoutes } from './noticesRoutes'
import { financesRoutes } from './financesRoutes'
import { serviceScheduleRoutes } from './serviceScheduleRoutes.js'
import { inviteLinkRoutes } from './inviteLinkRoutes.js'
import { uploadRoutes } from './uploadRoutes.js'
import { positionRoutes } from './positionRoutes.js'


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
        app.register(planRoutes, { prefix: '/plans' });
        app.register(subscriptionRoutes, { prefix: '/subscriptions' });
        app.register(adminRoutes);
        app.register(publicRegisterRoute, { prefix: '/public' })
        app.register(noticesRoutes, { prefix: '/notices' });
        app.register(financesRoutes, { prefix: '/finances' });
        app.register(serviceScheduleRoutes, { prefix: '/service-schedules' });
        // loginRoute já está registrado dentro de authRoutes, não precisa registrar novamente
        app.register(auditRoutes, { prefix: '/audit' })
        app.register(inviteLinkRoutes)
        app.register(uploadRoutes)
        app.register(positionRoutes)





}

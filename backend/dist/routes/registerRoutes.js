import { branchesRoutes } from './branchRoutes.js';
import { churchRoutes } from './churchRoutes.js';
import { membersRoutes } from './membersRoutes.js';
import { eventsRoutes } from './eventsRoutes.js';
import { contributionsRoutes } from './contributionsRoutes.js';
import { devotionalsRoutes } from './devotionalsRoutes.js';
import { authRoutes } from './auth';
import { permissionsRoutes } from './auth/permissions';
import { registerRoute } from './auth/register';
import { planRoutes } from './planRoutes';
import { subscriptionRoutes } from './subscriptionRoutes';
import { adminRoutes } from './adminRoutes';
import { publicRegisterRoute } from './public/register';
import { auditRoutes } from './auditRoutes';
export async function registerRoutes(app) {
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
    app.register(publicRegisterRoute, { prefix: '/public' });
    // loginRoute já está registrado dentro de authRoutes, não precisa registrar novamente
    app.register(auditRoutes, { prefix: '/audit' });
}

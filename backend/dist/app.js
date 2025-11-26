import Fastify from 'fastify';
import { registerRoutes } from './routes/registerRoutes';
import { authPlugin } from './plugins/authPlugin';
export function buildApp() {
    const app = Fastify();
    app.register(authPlugin);
    registerRoutes(app);
    return app;
}

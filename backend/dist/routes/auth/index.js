import { registerRoute } from './register';
import { loginRoute } from './login';
import { permissionsRoutes } from './permissions';
export async function authRoutes(app) {
    await registerRoute(app);
    await loginRoute(app);
    await permissionsRoutes(app);
    console.log('🔑 LoginRoute foi executado!');
}

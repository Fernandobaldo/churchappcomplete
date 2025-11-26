import { authenticate } from '../middlewares/authenticate';
export async function authPlugin(app) {
    app.decorate('authenticate', authenticate);
}

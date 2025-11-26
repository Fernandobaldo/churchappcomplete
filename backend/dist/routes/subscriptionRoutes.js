import { getMySubscriptionHandler, listAllSubscriptionsHandler, changePlanHandler } from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
export async function subscriptionRoutes(app) {
    app.get('/subscriptions/me', { preHandler: [authenticate] }, getMySubscriptionHandler);
    app.post('/subscriptions/change', { preHandler: [authenticate] }, changePlanHandler);
    app.get('/subscriptions', { preHandler: [authenticate, authorize(['SAAS_ADMIN'])] }, listAllSubscriptionsHandler);
}

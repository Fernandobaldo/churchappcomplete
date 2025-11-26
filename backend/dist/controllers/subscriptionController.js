import { changePlanSchema } from '../schemas/subscriptionSchema';
import { getMySubscription, listAllSubscriptions, changePlan } from '../services/subscriptionService';
export async function getMySubscriptionHandler(request, reply) {
    const userId = request.user.id;
    const sub = await getMySubscription(userId);
    return reply.send(sub);
}
export async function listAllSubscriptionsHandler(request, reply) {
    const all = await listAllSubscriptions();
    return reply.send(all);
}
export async function changePlanHandler(request, reply) {
    const parsed = changePlanSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { planId } = parsed.data;
    const userId = request.user.id;
    const updated = await changePlan(userId, planId);
    return reply.send(updated);
}

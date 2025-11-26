import { createPlanSchema } from '../schemas/planSchema';
import { createPlan, listPlans } from '../services/planService';
export async function createPlanHandler(request, reply) {
    const parsed = createPlanSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const plan = await createPlan(parsed.data);
    return reply.status(201).send(plan);
}
export async function listPlansHandler(request, reply) {
    const plans = await listPlans();
    return reply.send(plans);
}

import { prisma } from '../lib/prisma';
export async function createPlan(data) {
    return prisma.plan.create({ data });
}
export async function listPlans() {
    return prisma.plan.findMany();
}

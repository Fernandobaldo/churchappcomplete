import { prisma } from '../lib/prisma';

type PlanInput = {
name: string;
price: number;
features: string[];
maxMembers?: number;
maxBranches?: number;
};

export async function createPlan(data: PlanInput) {
  return prisma.plan.create({ data });
}

export async function listPlans() {
  return prisma.plan.findMany();
}

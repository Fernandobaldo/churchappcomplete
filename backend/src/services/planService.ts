import { prisma } from '../lib/prisma';
import { validateAndNormalizeFeatures, PlanFeatureId } from '../constants/planFeatures';

type PlanInput = {
  name: string;
  price: number;
  features: string[];
  maxMembers?: number;
  maxBranches?: number;
  billingInterval?: string;
  isActive?: boolean;
  gatewayProvider?: string;
  gatewayProductId?: string;
  gatewayPriceId?: string;
  code?: string;
};

/**
 * Validates and normalizes plan features before creation.
 * 
 * @throws Error if invalid features are provided
 */
function validatePlanFeatures(features: string[]): PlanFeatureId[] {
  const { valid, invalid } = validateAndNormalizeFeatures(features);
  
  if (invalid.length > 0) {
    throw new Error(
      `Invalid feature IDs: ${invalid.join(', ')}. ` +
      `Valid features are: ${valid.join(', ') || 'none'}`
    );
  }
  
  return valid;
}

export async function createPlan(data: PlanInput) {
  // Validate and normalize features BEFORE creating plan
  const validatedFeatures = validatePlanFeatures(data.features);
  
  return prisma.plan.create({ 
    data: {
      ...data,
      features: validatedFeatures,
    }
  });
}

export async function listPlans() {
  return prisma.plan.findMany({
    where: {
      isActive: true, // Apenas planos ativos
    },
    orderBy: {
      price: 'asc', // Ordenar por preço (menor para maior)
    },
  });
}

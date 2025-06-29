import { z } from 'zod';

export const createPlanSchema = z.object({
name: z.string(),
  price: z.number(),
  features: z.array(z.string()),
  maxMembers: z.number().nullable().optional(),
  maxBranches: z.number().nullable().optional(),
});

import { z } from 'zod';
export const createBranchSchema = z.object({
    name: z.string(),
    churchId: z.string(),
});

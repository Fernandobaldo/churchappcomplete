import { z } from 'zod';
export const assignPermissionsParamsSchema = z.object({
    id: z.string().cuid(),
});
export const assignPermissionsBodySchema = z.object({
    permissions: z.array(z.string()).min(1),
});

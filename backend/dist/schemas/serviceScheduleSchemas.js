import { z } from 'zod';
// Validação de time no formato HH:mm
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
const baseServiceScheduleSchema = z.object({
    branchId: z.string().cuid('ID da filial inválido').optional(),
    dayOfWeek: z.number().int().min(0).max(6, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'),
    time: z.string().regex(timeRegex, 'Hora deve estar no formato HH:mm'),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    location: z.string().optional(),
    isDefault: z.boolean().optional().default(false),
    autoCreateEvents: z.boolean().optional().default(false),
    autoCreateDaysAhead: z.number().int().min(1).max(365).optional(),
});
export const createServiceScheduleSchema = {
    body: baseServiceScheduleSchema,
};
export const updateServiceScheduleSchema = {
    body: baseServiceScheduleSchema.partial(),
};
export const serviceScheduleParamsSchema = {
    params: z.object({
        id: z.string().cuid('ID inválido'),
    }),
};
export const branchIdParamsSchema = {
    params: z.object({
        branchId: z.string().cuid('ID da filial inválido'),
    }),
};
export const createEventsBodySchema = z.object({
    startDate: z.string().optional(), // ISO string ou dd/MM/yyyy
    endDate: z.string().optional(), // ISO string ou dd/MM/yyyy
    daysAhead: z.number().int().min(1).max(365).optional(), // Quantos dias à frente criar eventos
});
export const createEventsSchema = {
    body: createEventsBodySchema,
};
export const deleteServiceScheduleBodySchema = z.object({
    deleteEvents: z.boolean().optional().default(false),
});
export const deleteServiceScheduleSchema = {
    body: deleteServiceScheduleBodySchema,
};

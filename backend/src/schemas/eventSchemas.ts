import { z } from 'zod'

const baseEventSchema = z.object({
title: z.string().min(1, 'Título obrigatório'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().min(1, 'Data de fim obrigatória'),
  time: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  hasDonation: z.boolean().optional(),
  donationReason: z.string().optional(),
  donationLink: z.string().url('Link inválido').optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
})

// Schema completo com validação condicional
export const eventBodySchema = baseEventSchema.refine(
  (data) => {
    if (data.hasDonation) return true
    return !data.donationReason && !data.donationLink
  },
  {
    message: 'Se "hasDonation" for falso, não envie motivo ou link de doação.',
    path: ['donationReason'],
  }
)

// Versão para atualização (todos os campos opcionais)
export const updateEventSchema = {
body: baseEventSchema.partial(),
}

// Validação de params com ID
export const eventIdParamSchema = {
  params: z.object({
    id: z.string().cuid('ID inválido'),
  }),
}

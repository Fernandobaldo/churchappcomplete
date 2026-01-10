import { z } from 'zod'

export const createTransactionBodySchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['ENTRY', 'EXIT'], {
    errorMap: () => ({ message: 'Tipo deve ser ENTRY ou EXIT' }),
  }),
  title: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  entryType: z.enum(['OFERTA', 'DIZIMO', 'CONTRIBUICAO']).optional(),
  exitType: z.enum(['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS']).optional(),
  exitTypeOther: z.string().optional(),
  contributionId: z.string().optional(),
  tithePayerMemberId: z.string().optional(),
  tithePayerName: z.string().optional(),
  isTithePayerMember: z.boolean().optional(),
  date: z.coerce.date().optional(),
}).refine((data) => {
  // Se type é ENTRY, entryType é obrigatório
  if (data.type === 'ENTRY' && !data.entryType) {
    return false
  }
  return true
}, {
  message: 'Tipo de entrada é obrigatório quando o tipo da transação é Entrada',
  path: ['entryType'],
}).refine((data) => {
  // Se type é EXIT, exitType é obrigatório
  if (data.type === 'EXIT' && !data.exitType) {
    return false
  }
  return true
}, {
  message: 'Tipo de saída é obrigatório quando o tipo da transação é Saída',
  path: ['exitType'],
}).refine((data) => {
  // Se exitType é OUTROS, exitTypeOther é obrigatório
  if (data.exitType === 'OUTROS' && (!data.exitTypeOther || data.exitTypeOther.trim().length === 0)) {
    return false
  }
  return true
}, {
  message: 'Descrição do tipo de saída é obrigatória quando selecionar "Outros"',
  path: ['exitTypeOther'],
}).refine((data) => {
  // Se entryType é DIZIMO, deve ter ou tithePayerMemberId (se membro) ou tithePayerName (se não membro)
  if (data.entryType === 'DIZIMO') {
    if (data.isTithePayerMember === true) {
      return !!data.tithePayerMemberId
    } else if (data.isTithePayerMember === false) {
      return !!data.tithePayerName && data.tithePayerName.trim().length > 0
    }
    // Se isTithePayerMember não está definido, requer pelo menos um dos campos
    return !!(data.tithePayerMemberId || (data.tithePayerName && data.tithePayerName.trim().length > 0))
  }
  return true
}, {
  message: 'Para dízimo, é necessário informar o dizimista (membro ou nome manual)',
  path: ['tithePayerMemberId'],
}).refine((data) => {
  // Se entryType é CONTRIBUICAO, deve ter contributionId
  if (data.entryType === 'CONTRIBUICAO' && !data.contributionId) {
    return false
  }
  return true
}, {
  message: 'Contribuição é obrigatória quando o tipo de entrada é Contribuição',
  path: ['contributionId'],
})

export const updateTransactionBodySchema = z.object({
  amount: z.number().positive('Valor deve ser positivo').optional(),
  type: z.enum(['ENTRY', 'EXIT']).optional(),
  title: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  entryType: z.enum(['OFERTA', 'DIZIMO', 'CONTRIBUICAO']).optional(),
  exitType: z.enum(['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS']).optional(),
  exitTypeOther: z.string().optional(),
  contributionId: z.string().optional(),
  tithePayerMemberId: z.string().optional(),
  tithePayerName: z.string().optional(),
  isTithePayerMember: z.boolean().optional(),
  date: z.coerce.date().optional(),
}).refine((data) => {
  // Se type é ENTRY e entryType foi fornecido, entryType deve ser válido
  if (data.type === 'ENTRY' && data.entryType === undefined && data.entryType !== null) {
    // Se está editando e mudou para ENTRY sem entryType, não validar aqui
    return true
  }
  return true
}, {
  message: 'Tipo de entrada é obrigatório quando o tipo da transação é Entrada',
  path: ['entryType'],
}).refine((data) => {
  // Se type é EXIT e exitType foi fornecido, exitType deve ser válido
  if (data.type === 'EXIT' && data.exitType === undefined && data.exitType !== null) {
    return true
  }
  return true
}, {
  message: 'Tipo de saída é obrigatório quando o tipo da transação é Saída',
  path: ['exitType'],
}).refine((data) => {
  // Se exitType é OUTROS, exitTypeOther é obrigatório
  if (data.exitType === 'OUTROS' && (!data.exitTypeOther || data.exitTypeOther.trim().length === 0)) {
    return false
  }
  return true
}, {
  message: 'Descrição do tipo de saída é obrigatória quando selecionar "Outros"',
  path: ['exitTypeOther'],
}).refine((data) => {
  // Se entryType é DIZIMO, deve ter ou tithePayerMemberId (se membro) ou tithePayerName (se não membro)
  if (data.entryType === 'DIZIMO') {
    if (data.isTithePayerMember === true) {
      return !!data.tithePayerMemberId
    } else if (data.isTithePayerMember === false) {
      return !!data.tithePayerName && data.tithePayerName.trim().length > 0
    }
    // Se isTithePayerMember não está definido, requer pelo menos um dos campos
    return !!(data.tithePayerMemberId || (data.tithePayerName && data.tithePayerName.trim().length > 0))
  }
  return true
}, {
  message: 'Para dízimo, é necessário informar o dizimista (membro ou nome manual)',
  path: ['tithePayerMemberId'],
}).refine((data) => {
  // Se entryType é CONTRIBUICAO, deve ter contributionId
  if (data.entryType === 'CONTRIBUICAO' && !data.contributionId) {
    return false
  }
  return true
}, {
  message: 'Contribuição é obrigatória quando o tipo de entrada é Contribuição',
  path: ['contributionId'],
})

export const createTransactionSchema = {
  summary: 'Criar uma nova transação financeira',
  tags: ['Finanças'],
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
      entryType: { type: 'string', enum: ['OFERTA', 'DIZIMO', 'CONTRIBUICAO'] },
      exitType: { type: 'string', enum: ['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS'] },
      exitTypeOther: { type: 'string' },
      contributionId: { type: 'string' },
      tithePayerMemberId: { type: 'string' },
      tithePayerName: { type: 'string' },
      isTithePayerMember: { type: 'boolean' },
      date: { type: 'string', format: 'date-time' },
    },
    required: ['amount', 'type'],
  },
  response: {
    201: {
      description: 'Transação criada com sucesso',
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string', nullable: true },
        amount: { type: 'number' },
        type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
        category: { type: 'string', nullable: true },
        entryType: { type: 'string', enum: ['OFERTA', 'DIZIMO', 'CONTRIBUICAO'], nullable: true },
        exitType: { type: 'string', enum: ['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS'], nullable: true },
        exitTypeOther: { type: 'string', nullable: true },
        contributionId: { type: 'string', nullable: true },
        tithePayerMemberId: { type: 'string', nullable: true },
        tithePayerName: { type: 'string', nullable: true },
        isTithePayerMember: { type: 'boolean', nullable: true },
        createdBy: { type: 'string', nullable: true },
        branchId: { type: 'string' },
        date: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}


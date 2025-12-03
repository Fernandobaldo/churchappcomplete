// tests/e2e/helpers/testHelpers.ts
import request from 'supertest'
import { FastifyInstance } from 'fastify'

export interface AuthenticatedRequest {
  token: string
  userId: string
  memberId?: string
  branchId?: string
  churchId?: string
}

/**
 * Registra um novo usuário via endpoint público
 */
export async function registerUser(
  app: FastifyInstance,
  userData: { name: string; email: string; password: string }
) {
  const response = await request(app.server)
    .post('/public/register')
    .send(userData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao registrar usuário: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return {
    user: response.body.user,
    token: response.body.token,
  }
}

/**
 * Faz login e retorna o token
 */
export async function loginUser(
  app: FastifyInstance,
  credentials: { email: string; password: string }
) {
  const response = await request(app.server)
    .post('/auth/login')
    .send(credentials)

  if (response.status !== 200) {
    throw new Error(
      `Falha ao fazer login: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return {
    user: response.body.user,
    token: response.body.token,
    type: response.body.type,
  }
}

/**
 * Cria uma igreja (requer autenticação)
 * Retorna o resultado com o novo token (se disponível)
 */
export async function createChurch(
  app: FastifyInstance,
  token: string,
  churchData: {
    name: string
    branchName?: string
    pastorName?: string
    logoUrl?: string
  }
) {
  const response = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${token}`)
    .send(churchData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar igreja: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return {
    ...response.body,
    // O novo token vem na resposta (com dados do member)
    newToken: response.body.token || token,
  }
}

/**
 * Cria um evento (requer autenticação e branchId)
 */
export async function createEvent(
  app: FastifyInstance,
  token: string,
  eventData: {
    title: string
    startDate: string // formato: dd/MM/yyyy
    endDate: string // formato: dd/MM/yyyy
    time?: string
    location?: string
    description?: string
    hasDonation?: boolean
    donationReason?: string
    donationLink?: string
    imageUrl?: string
  }
) {
  const response = await request(app.server)
    .post('/events')
    .set('Authorization', `Bearer ${token}`)
    .send(eventData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar evento: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Cria uma contribuição (requer autenticação, role e permissão)
 */
export async function createContribution(
  app: FastifyInstance,
  token: string,
  contributionData: {
    title: string
    description?: string
    goal?: number
    endDate?: string // ISO string
    isActive?: boolean
    paymentMethods?: Array<{
      type: 'PIX' | 'CONTA_BR' | 'IBAN'
      data: Record<string, any>
    }>
  }
) {
  const response = await request(app.server)
    .post('/contributions')
    .set('Authorization', `Bearer ${token}`)
    .send(contributionData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar contribuição: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Cria uma transação financeira (requer autenticação, role e permissão)
 */
export async function createTransaction(
  app: FastifyInstance,
  token: string,
  transactionData: {
    title: string
    amount: number
    type: 'ENTRY' | 'EXIT'
    category?: string
    entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO'
    exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS'
    exitTypeOther?: string
    tithePayerMemberId?: string
    tithePayerName?: string
    isTithePayerMember?: boolean
    contributionId?: string
  }
) {
  const response = await request(app.server)
    .post('/finances')
    .set('Authorization', `Bearer ${token}`)
    .send(transactionData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar transação: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Fluxo completo: registra usuário e cria igreja
 */
export async function setupCompleteUser(
  app: FastifyInstance,
  userData: {
    name: string
    email: string
    password: string
  },
  churchData: {
    name: string
    branchName?: string
    pastorName?: string
  }
): Promise<AuthenticatedRequest> {
  // 1. Registra o usuário
  const registerResult = await registerUser(app, userData)

  // 2. Cria a igreja (isso também cria o member e branch)
  const churchResult = await createChurch(app, registerResult.token, churchData)

  // 3. Retorna informações completas
  // IMPORTANTE: Usa o novo token que contém role, branchId e permissions
  return {
    token: churchResult.newToken, // Token atualizado com dados do member
    userId: registerResult.user.id,
    memberId: churchResult.member?.id,
    branchId: churchResult.branch?.id,
    churchId: churchResult.church?.id || churchResult.id,
  }
}

/**
 * Concede uma permissão específica a um membro
 */
export async function assignPermission(
  app: FastifyInstance,
  adminToken: string,
  memberId: string,
  permissionType: string
) {
  const response = await request(app.server)
    .post(`/permissions/${memberId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ permissions: [permissionType] })

  if (response.status !== 200) {
    throw new Error(
      `Falha ao conceder permissão: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Atualiza a role de um membro
 */
export async function updateMemberRole(
  app: FastifyInstance,
  adminToken: string,
  memberId: string,
  newRole: 'MEMBER' | 'COORDINATOR' | 'ADMINFILIAL'
) {
  const response = await request(app.server)
    .patch(`/members/${memberId}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: newRole })

  if (response.status !== 200) {
    throw new Error(
      `Falha ao atualizar role: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Cria um devocional (requer autenticação e permissão devotional_manage)
 */
export async function createDevotional(
  app: FastifyInstance,
  token: string,
  devotionalData: {
    title: string
    passage: string
    content?: string
  }
) {
  const response = await request(app.server)
    .post('/devotionals')
    .set('Authorization', `Bearer ${token}`)
    .send(devotionalData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar devocional: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Cria um membro (requer autenticação e permissão members_manage)
 */
export async function createMember(
  app: FastifyInstance,
  token: string,
  memberData: {
    name: string
    email: string
    password: string
    role?: 'MEMBER' | 'COORDINATOR' | 'ADMINFILIAL'
    phone?: string
    address?: string
    birthDate?: string
    branchId?: string
  }
) {
  const response = await request(app.server)
    .post('/register')
    .set('Authorization', `Bearer ${token}`)
    .send(memberData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar membro: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Cria um horário de culto (requer autenticação, role e permissão church_manage)
 */
export async function createServiceSchedule(
  app: FastifyInstance,
  token: string,
  scheduleData: {
    title: string
    time: string
    dayOfWeek: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    description?: string
    location?: string
    branchId: string
  }
) {
  const response = await request(app.server)
    .post('/service-schedules')
    .set('Authorization', `Bearer ${token}`)
    .send(scheduleData)

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar horário de culto: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}

/**
 * Busca um recurso por ID (genérico)
 */
export async function getResourceById(
  app: FastifyInstance,
  token: string,
  resourcePath: string,
  resourceId: string
) {
  const response = await request(app.server)
    .get(`/${resourcePath}/${resourceId}`)
    .set('Authorization', `Bearer ${token}`)

  if (response.status !== 200) {
    throw new Error(
      `Falha ao buscar recurso: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return response.body
}


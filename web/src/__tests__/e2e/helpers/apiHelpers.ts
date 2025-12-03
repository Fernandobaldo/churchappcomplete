// src/__tests__/e2e/helpers/apiHelpers.ts
// Helpers para testes E2E que fazem chamadas reais à API (sem mocks)
import axios from 'axios'

const API_URL = process.env.VITE_API_URL || 'http://localhost:3333'

// Cria uma instância do axios sem interceptors para testes
const testApi = axios.create({
  baseURL: API_URL,
})

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
  userData: { name: string; email: string; password: string }
) {
  try {
    // Usa o endpoint público correto
    const response = await testApi.post('/public/register', userData)
    
    if (response.status !== 201) {
      throw new Error(
        `Falha ao registrar usuário: ${response.status} - ${JSON.stringify(response.data)}`
      )
    }
    
    return {
      user: response.data.user,
      token: response.data.token,
    }
  } catch (error: any) {
    // Melhora o tratamento de erros para mostrar mais informações
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      const errorMessage = data?.message || data?.error || JSON.stringify(data)
      
      // Mensagem mais amigável para erro 500
      if (status === 500) {
        throw new Error(
          `Erro interno do servidor (500) ao registrar usuário.\n` +
          `Mensagem: ${errorMessage}\n` +
          `Possíveis causas:\n` +
          `  - Plano gratuito não existe no banco de dados\n` +
          `  - Banco de dados não está configurado corretamente\n` +
          `  - Execute: cd backend && npm run seed (para criar o plano gratuito)\n` +
          `Endpoint: /public/register\n` +
          `Dados enviados: ${JSON.stringify(userData)}`
        )
      }
      
      throw new Error(
        `Falha ao registrar usuário: ${status}\n` +
        `Mensagem: ${errorMessage}\n` +
        `Endpoint: /public/register\n` +
        `Dados enviados: ${JSON.stringify(userData)}`
      )
    }
    
    // Erro de rede ou outro tipo
    if (error.message) {
      throw new Error(
        `Erro ao conectar com o backend: ${error.message}\n` +
        `Certifique-se de que o backend está rodando em ${API_URL}`
      )
    }
    
    throw error
  }
}

/**
 * Faz login e retorna o token
 */
export async function loginUser(credentials: { email: string; password: string }) {
  const response = await testApi.post('/auth/login', credentials)

  if (response.status !== 200) {
    throw new Error(
      `Falha ao fazer login: ${response.status} - ${JSON.stringify(response.data)}`
    )
  }

  return {
    user: response.data.user,
    token: response.data.token,
    type: response.data.type,
  }
}

/**
 * Cria uma igreja (requer autenticação)
 * Retorna o resultado com o novo token (se disponível)
 */
export async function createChurch(
  token: string,
  churchData: {
    name: string
    branchName?: string
    pastorName?: string
    logoUrl?: string
    withBranch?: boolean
  }
) {
  try {
    const response = await testApi.post(
      '/churches',
      {
        name: churchData.name,
        branchName: churchData.branchName || 'Sede',
        pastorName: churchData.pastorName,
        logoUrl: churchData.logoUrl,
        withBranch: churchData.withBranch !== false, // default true
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.status !== 201) {
      throw new Error(
        `Falha ao criar igreja: ${response.status} - ${JSON.stringify(response.data)}`
      )
    }

    const newToken = response.data.token || token
    
    // Valida que o token foi retornado
    if (!newToken) {
      console.warn('[API Helper] ⚠️ Token não foi retornado na resposta da criação de igreja')
      console.warn('[API Helper] ⚠️ Resposta completa:', JSON.stringify(response.data, null, 2))
    }
    
    return {
      ...response.data,
      // O novo token vem na resposta (com dados do member)
      newToken,
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      const errorMessage = data?.message || data?.error || JSON.stringify(data)
      
      if (status === 401) {
        throw new Error(
          `Erro de autenticação (401) ao criar igreja.\n` +
          `Mensagem: ${errorMessage}\n` +
          `Possíveis causas:\n` +
          `  - Token inválido ou expirado\n` +
          `  - Token não está sendo enviado corretamente\n` +
          `  - JWT_SECRET diferente entre backend e token\n` +
          `Token usado: ${token.substring(0, 50)}...\n` +
          `Endpoint: /churches\n` +
          `Dados enviados: ${JSON.stringify(churchData)}`
        )
      }
      
      throw new Error(
        `Falha ao criar igreja: ${status}\n` +
        `Mensagem: ${errorMessage}\n` +
        `Endpoint: /churches\n` +
        `Dados enviados: ${JSON.stringify(churchData)}`
      )
    }
    throw error
  }
}

/**
 * Cria um evento (requer autenticação e branchId)
 */
export async function createEvent(
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
  const response = await testApi.post(
    '/events',
    eventData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (response.status !== 201) {
    throw new Error(
      `Falha ao criar evento: ${response.status} - ${JSON.stringify(response.data)}`
    )
  }

  return response.data
}

/**
 * Cria uma campanha de contribuição (requer autenticação, role e permissão)
 */
export async function createContribution(
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
  try {
    const response = await testApi.post(
      '/contributions',
      contributionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.status !== 201) {
      throw new Error(
        `Falha ao criar contribuição: ${response.status} - ${JSON.stringify(response.data)}`
      )
    }

    return response.data
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      const errorMessage = data?.message || data?.error || JSON.stringify(data)
      
      if (status === 401) {
        throw new Error(
          `Erro de autenticação (401) ao criar contribuição.\n` +
          `Mensagem: ${errorMessage}\n` +
          `Possíveis causas:\n` +
          `  - Token inválido ou expirado\n` +
          `  - Token não contém permissões necessárias (contributions_manage)\n` +
          `  - Token não contém role necessário (ADMINGERAL, ADMINFILIAL ou COORDINATOR)\n` +
          `  - JWT_SECRET diferente entre backend e token\n` +
          `Token usado: ${token.substring(0, 50)}...\n` +
          `Endpoint: /contributions\n` +
          `Dados enviados: ${JSON.stringify(contributionData)}`
        )
      }
      
      if (status === 403) {
        throw new Error(
          `Erro de autorização (403) ao criar contribuição.\n` +
          `Mensagem: ${errorMessage}\n` +
          `Possíveis causas:\n` +
          `  - Usuário não tem permissão contributions_manage\n` +
          `  - Usuário não tem role ADMINGERAL, ADMINFILIAL ou COORDINATOR\n` +
          `Endpoint: /contributions\n` +
          `Dados enviados: ${JSON.stringify(contributionData)}`
        )
      }
      
      throw new Error(
        `Falha ao criar contribuição: ${status}\n` +
        `Mensagem: ${errorMessage}\n` +
        `Endpoint: /contributions\n` +
        `Dados enviados: ${JSON.stringify(contributionData)}`
      )
    }
    throw error
  }
}

/**
 * Fluxo completo: registra usuário e cria igreja
 */
export async function setupCompleteUser(
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
  const registerResult = await registerUser(userData)

  // 2. Cria a igreja (isso também cria o member e branch)
  const churchResult = await createChurch(registerResult.token, churchData)

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


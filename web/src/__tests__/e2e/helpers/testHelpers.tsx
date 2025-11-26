// src/__tests__/e2e/helpers/testHelpers.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/api'
import Register from '@/pages/Register'
import Login from '@/pages/Login'
import Church from '@/pages/onboarding/Church'
import Events from '@/pages/Events'
import AddEvent from '@/pages/Events/AddEvent'
import Contributions from '@/pages/Contributions'
import AddContribution from '@/pages/Contributions/AddContribution'
import { format } from 'date-fns'

export interface AuthenticatedUser {
  token: string
  userId: string
  memberId?: string
  branchId?: string
  churchId?: string
  email: string
  name: string
}

/**
 * Registra um novo usuário através da interface
 */
export async function registerUserViaUI(
  userData: { name: string; email: string; password: string; churchName: string }
): Promise<AuthenticatedUser> {
  const user = userEvent.setup()
  
  // Mock da API de registro
  const mockRegisterResponse = {
    data: {
      user: {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
      },
      token: `token-${Date.now()}`,
    },
  }

  const mockChurchResponse = {
    data: {
      church: {
        id: `church-${Date.now()}`,
        name: userData.churchName,
      },
      branch: {
        id: `branch-${Date.now()}`,
        name: 'Sede Principal',
      },
      member: {
        id: `member-${Date.now()}`,
      },
      token: `member-token-${Date.now()}`,
    },
  }

  vi.mocked(api.post)
    .mockResolvedValueOnce(mockRegisterResponse)
    .mockResolvedValueOnce(mockChurchResponse)

  // Renderiza a página de registro
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  )

  // Preenche o formulário
  await user.type(screen.getByLabelText(/nome/i), userData.name)
  await user.type(screen.getByLabelText(/email/i), userData.email)
  await user.type(screen.getByLabelText(/senha/i), userData.password)
  await user.type(screen.getByLabelText(/nome da igreja/i), userData.churchName)

  // Submete o formulário
  await user.click(screen.getByRole('button', { name: /registrar|cadastrar/i }))

  // Aguarda o registro ser concluído
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    })
  })

  const registerCall = vi.mocked(api.post).mock.calls[0]
  const registerResponse = await registerCall[1]
  
  return {
    token: mockChurchResponse.data.token,
    userId: mockRegisterResponse.data.user.id,
    memberId: mockChurchResponse.data.member.id,
    branchId: mockChurchResponse.data.branch.id,
    churchId: mockChurchResponse.data.church.id,
    email: userData.email,
    name: userData.name,
  }
}

/**
 * Faz login através da interface
 */
export async function loginUserViaUI(
  credentials: { email: string; password: string }
): Promise<AuthenticatedUser> {
  const user = userEvent.setup()

  const mockLoginResponse = {
    data: {
      user: {
        id: `user-${Date.now()}`,
        name: 'Usuário Teste',
        email: credentials.email,
        role: 'ADMINGERAL',
        branchId: `branch-${Date.now()}`,
        permissions: [],
      },
      token: `token-${Date.now()}`,
      type: 'member',
    },
  }

  vi.mocked(api.post).mockResolvedValueOnce(mockLoginResponse)

  // Renderiza a página de login
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  )

  // Preenche o formulário
  await user.type(screen.getByLabelText(/email/i), credentials.email)
  await user.type(screen.getByLabelText(/senha/i), credentials.password)

  // Submete o formulário
  await user.click(screen.getByRole('button', { name: /entrar|login/i }))

  // Aguarda o login ser concluído
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials)
  })

  return {
    token: mockLoginResponse.data.token,
    userId: mockLoginResponse.data.user.id,
    branchId: mockLoginResponse.data.user.branchId,
    email: credentials.email,
    name: mockLoginResponse.data.user.name,
  }
}

/**
 * Cria uma igreja através da interface (onboarding)
 */
export async function createChurchViaUI(
  auth: AuthenticatedUser,
  churchData: { name: string; branchName?: string; pastorName?: string }
): Promise<AuthenticatedUser> {
  const user = userEvent.setup()

  // Configura o store de autenticação
  useAuthStore.setState({
    token: auth.token,
    user: {
      id: auth.userId,
      email: auth.email,
      name: auth.name,
      role: '',
      branchId: '',
      permissions: [],
    },
  })

  const mockChurchResponse = {
    data: {
      church: {
        id: `church-${Date.now()}`,
        name: churchData.name,
      },
      branch: {
        id: `branch-${Date.now()}`,
        name: churchData.branchName || 'Sede Principal',
      },
      member: {
        id: `member-${Date.now()}`,
      },
      token: `member-token-${Date.now()}`,
    },
  }

  vi.mocked(api.post).mockResolvedValueOnce(mockChurchResponse)

  // Renderiza a página de criação de igreja
  render(
    <MemoryRouter initialEntries={['/onboarding/church']}>
      <Routes>
        <Route path="/onboarding/church" element={<Church />} />
      </Routes>
    </MemoryRouter>
  )

  // Preenche o formulário
  await user.type(screen.getByLabelText(/nome da igreja/i), churchData.name)
  if (churchData.branchName) {
    await user.type(screen.getByLabelText(/nome da filial/i), churchData.branchName)
  }
  if (churchData.pastorName) {
    const pastorInput = screen.queryByLabelText(/nome do pastor/i)
    if (pastorInput) {
      await user.type(pastorInput, churchData.pastorName)
    }
  }

  // Submete o formulário
  const submitButton = screen.getByRole('button', { name: /salvar|continuar|criar/i })
  await user.click(submitButton)

  // Aguarda a criação ser concluída
  await waitFor(() => {
    expect(api.post).toHaveBeenCalled()
  })

  return {
    ...auth,
    token: mockChurchResponse.data.token,
    memberId: mockChurchResponse.data.member.id,
    branchId: mockChurchResponse.data.branch.id,
    churchId: mockChurchResponse.data.church.id,
  }
}

/**
 * Cria um evento através da interface
 */
export async function createEventViaUI(
  auth: AuthenticatedUser,
  eventData: {
    title: string
    startDate: Date
    endDate: Date
    time?: string
    location?: string
    description?: string
  }
) {
  const user = userEvent.setup()

  // Configura o store de autenticação
  useAuthStore.setState({
    token: auth.token,
    user: {
      id: auth.userId,
      email: auth.email,
      name: auth.name,
      role: 'ADMINGERAL',
      branchId: auth.branchId || '',
      permissions: [{ type: 'events_manage' }],
    },
  })

  const mockEventResponse = {
    data: {
      id: `event-${Date.now()}`,
      title: eventData.title,
      startDate: eventData.startDate.toISOString(),
      endDate: eventData.endDate.toISOString(),
      time: eventData.time,
      location: eventData.location,
      description: eventData.description,
      branchId: auth.branchId,
    },
  }

  vi.mocked(api.post).mockResolvedValueOnce(mockEventResponse)
  vi.mocked(api.get).mockResolvedValue({ data: [] })

  // Renderiza a página de adicionar evento
  render(
    <MemoryRouter initialEntries={['/app/events/new']}>
      <Routes>
        <Route path="/app/events/new" element={<AddEvent />} />
      </Routes>
    </MemoryRouter>
  )

  // Preenche o formulário
  await user.type(screen.getByLabelText(/título/i), eventData.title)

  // Preenche data no formato datetime-local (YYYY-MM-DDTHH:mm)
  if (eventData.startDate) {
    const dateInput = screen.getByLabelText(/data e hora/i)
    await user.clear(dateInput)
    // Formato datetime-local: YYYY-MM-DDTHH:mm
    const dateTimeLocal = eventData.startDate.toISOString().slice(0, 16)
    await user.type(dateInput, dateTimeLocal)
  }

  if (eventData.time) {
    const timeInput = screen.queryByLabelText(/horário|hora/i)
    if (timeInput) {
      await user.type(timeInput, eventData.time)
    }
  }

  if (eventData.location) {
    const locationInput = screen.queryByLabelText(/local|localização/i)
    if (locationInput) {
      await user.type(locationInput, eventData.location)
    }
  }

  if (eventData.description) {
    const descriptionInput = screen.queryByLabelText(/descrição/i)
    if (descriptionInput) {
      await user.type(descriptionInput, eventData.description)
    }
  }

  // Submete o formulário
  const submitButton = screen.getByRole('button', { name: /salvar|criar|adicionar/i })
  await user.click(submitButton)

  // Aguarda a criação ser concluída
  await waitFor(() => {
    expect(api.post).toHaveBeenCalled()
  })

  return mockEventResponse.data
}

/**
 * Cria uma contribuição através da interface
 */
export async function createContributionViaUI(
  auth: AuthenticatedUser,
  contributionData: {
    title: string
    value: number
    date: Date
    type: 'DIZIMO' | 'OFERTA' | 'OUTRO'
    description?: string
  }
) {
  const user = userEvent.setup()

  // Configura o store de autenticação
  useAuthStore.setState({
    token: auth.token,
    user: {
      id: auth.userId,
      email: auth.email,
      name: auth.name,
      role: 'ADMINGERAL',
      branchId: auth.branchId || '',
      permissions: [{ type: 'contributions_manage' }],
    },
  })

  const mockContributionResponse = {
    data: {
      id: `contribution-${Date.now()}`,
      title: contributionData.title,
      value: contributionData.value,
      date: contributionData.date.toISOString(),
      type: contributionData.type,
      description: contributionData.description,
      branchId: auth.branchId,
    },
  }

  vi.mocked(api.post).mockResolvedValueOnce(mockContributionResponse)
  vi.mocked(api.get).mockResolvedValue({ data: [] })

  // Renderiza a página de adicionar contribuição
  render(
    <MemoryRouter initialEntries={['/app/contributions/new']}>
      <Routes>
        <Route path="/app/contributions/new" element={<AddContribution />} />
      </Routes>
    </MemoryRouter>
  )

  // Preenche o formulário
  await user.type(screen.getByLabelText(/título/i), contributionData.title)
  await user.type(screen.getByLabelText(/valor/i), contributionData.value.toString())
  
  const dateInput = screen.getByLabelText(/data/i)
  await user.clear(dateInput)
  await user.type(dateInput, format(contributionData.date, 'dd/MM/yyyy'))

  // Seleciona o tipo
  const typeSelect = screen.getByLabelText(/tipo/i)
  await user.selectOptions(typeSelect, contributionData.type)

  if (contributionData.description) {
    const descriptionInput = screen.queryByLabelText(/descrição/i)
    if (descriptionInput) {
      await user.type(descriptionInput, contributionData.description)
    }
  }

  // Submete o formulário
  const submitButton = screen.getByRole('button', { name: /salvar|criar|adicionar/i })
  await user.click(submitButton)

  // Aguarda a criação ser concluída
  await waitFor(() => {
    expect(api.post).toHaveBeenCalled()
  })

  return mockContributionResponse.data
}

/**
 * Setup completo: registro + criação de igreja
 */
export async function setupCompleteUserViaUI(
  userData: { name: string; email: string; password: string; churchName: string },
  churchData?: { branchName?: string; pastorName?: string }
): Promise<AuthenticatedUser> {
  // 1. Registra o usuário
  const auth = await registerUserViaUI({
    ...userData,
    churchName: userData.churchName,
  })

  // Se já tem branchId do registro, retorna
  if (auth.branchId) {
    return auth
  }

  // 2. Cria a igreja (se necessário)
  if (churchData) {
    return await createChurchViaUI(auth, {
      name: userData.churchName,
      ...churchData,
    })
  }

  return auth
}


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventDetails from '@/pages/Events/EventDetails'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/api')
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

const mockNavigate = vi.fn()
const mockParams = { id: 'event-1' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe('EventDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza detalhes do evento
  // ============================================================================
  it('deve renderizar detalhes do evento', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'events_manage' }] })
    const mockEvent = fixtures.event({
      id: 'event-1',
      title: 'Culto de Domingo',
      description: 'Culto matutino',
      location: 'Igreja Central',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
    })
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EventDetails />, {
      initialEntries: ['/app/events/event-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const titleElement = document.getElementById('event-title')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement?.textContent).toBe('Culto de Domingo')
      
      const descriptionElement = document.getElementById('event-description')
      expect(descriptionElement).toBeInTheDocument()
      expect(descriptionElement?.textContent).toBe('Culto matutino')
      
      expect(screen.getByText('Igreja Central')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Navega para editar ao clicar em Editar
  // ============================================================================
  it('deve navegar para editar ao clicar em Editar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ 
      role: 'ADMINGERAL',
      permissions: [{ type: 'events_manage' }] 
    })
    const mockEvent = fixtures.event({
      id: 'event-1',
      title: 'Evento Teste',
      description: 'Descrição do evento',
    })
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EventDetails />, {
      initialEntries: ['/app/events/event-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      const titleElement = document.getElementById('event-title')
      expect(titleElement?.textContent).toBe('Evento Teste')
    }, { timeout: 3000 })

    await waitFor(() => {
      const editButton = document.getElementById('edit-button') || screen.queryByText('Editar')
      expect(editButton).toBeTruthy()
    }, { timeout: 5000 })

    const editButton = document.getElementById('edit-button') as HTMLButtonElement | null
      || screen.getByText('Editar').closest('button') as HTMLButtonElement
    await user.click(editButton!)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1/edit')
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Deleta evento com confirmação
  // ============================================================================
  it('deve deletar evento com confirmação', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ 
      role: 'ADMINGERAL',
      permissions: [{ type: 'events_manage' }] 
    })
    const mockEvent = fixtures.event({
      id: 'event-1',
      title: 'Evento para Deletar',
    })
    mockApiResponse('get', '/events/event-1', mockEvent)
    mockApiResponse('delete', '/events/event-1', {})
    window.confirm = vi.fn(() => true)

    // Act
    renderWithProviders(<EventDetails />, {
      initialEntries: ['/app/events/event-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      const deleteButton = document.getElementById('delete-button')
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 3000 })

    const deleteButton = document.getElementById('delete-button') || screen.getByText('Excluir')
    await user.click(deleteButton as HTMLElement)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Evento excluído com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  // ============================================================================
  // TESTE 4: ERROR STATE - Exibe erro quando falha ao carregar evento
  // ============================================================================
  it('deve exibir erro quando falha ao carregar evento', async () => {
    // Arrange
    const mockUser = fixtures.user()
    mockApiError('get', '/events/event-1', { message: 'Erro ao carregar' })

    // Act
    renderWithProviders(<EventDetails />, {
      initialEntries: ['/app/events/event-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar evento')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para lista ao clicar em Voltar
  // ============================================================================
  it('deve navegar para lista ao clicar em Voltar', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user()
    const mockEvent = fixtures.event({ id: 'event-1' })
    mockApiResponse('get', '/events/event-1', mockEvent)

    // Act
    renderWithProviders(<EventDetails />, {
      initialEntries: ['/app/events/event-1'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      const backButton = document.getElementById('back-button')
      expect(backButton).toBeInTheDocument()
    })

    const backButton = document.getElementById('back-button') || screen.getByText('Voltar')
    await user.click(backButton)

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})

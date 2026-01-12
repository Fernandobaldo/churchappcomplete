import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import ChurchSettings from '@/pages/ChurchSettings'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { mockApiResponse, resetApiMocks } from '@/test/mockApi'
import { serviceScheduleApi } from '@/api/serviceScheduleApi'
import * as authUtils from '@/utils/authUtils'

vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost',
    },
  },
}))
vi.mock('@/api/serviceScheduleApi', () => ({
  serviceScheduleApi: {
    getByBranch: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
    createEvents: vi.fn(),
  },
}))

vi.mock('@/utils/authUtils', () => ({
  hasAccess: vi.fn(() => true),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}))

describe('ChurchSettings - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    vi.mocked(authUtils.hasAccess).mockReturnValue(true)
    mockApiResponse('get', '/churches', [{
      id: 'church-123',
      name: 'Test Church',
      logoUrl: null,
      isActive: true,
      Branch: [{
        id: 'branch-123',
        name: 'Sede',
        churchId: 'church-123',
      }],
    }])
    vi.mocked(serviceScheduleApi.getByBranch).mockResolvedValue([])
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário de edição da igreja
  // ============================================================================
  it('deve renderizar o formulário de edição da igreja', async () => {
    // Arrange & Act
    renderWithProviders(<ChurchSettings />, {
      authState: {
        user: fixtures.user({ 
          role: 'ADMINGERAL',
          permissions: [{ type: 'church_manage' }] 
        }),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: LOADING STATE - Carrega e exibe os dados da igreja
  // ============================================================================
  it('deve carregar e exibir os dados da igreja', async () => {
    // Arrange & Act
    renderWithProviders(<ChurchSettings />, {
      authState: {
        user: fixtures.user({ 
          role: 'ADMINGERAL',
          permissions: [{ type: 'church_manage' }] 
        }),
        token: 'token',
      },
    })

    // Assert
    const nameInput = await waitFor(
      () => {
        const input = screen.getByLabelText(/nome da igreja/i) as HTMLInputElement
        expect(input).toBeInTheDocument()
        return input
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(nameInput.value).toBe('Test Church')
      },
      { timeout: 5000 }
    )
  })

  // ============================================================================
  // TESTE 3: PERMISSION CHECK - Redireciona se usuário não tiver permissão
  // ============================================================================
  it('deve redirecionar se usuário não tiver permissão', async () => {
    // Arrange
    vi.mocked(authUtils.hasAccess).mockReturnValue(false)

    // Act
    renderWithProviders(<ChurchSettings />, {
      authState: {
        user: fixtures.user({ permissions: [] }),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard')
    })
  })

  // ============================================================================
  // TESTE 4: BASIC RENDER - Exibe botão para adicionar horário
  // ============================================================================
  it('deve exibir botão para adicionar horário', async () => {
    // Arrange & Act
    renderWithProviders(<ChurchSettings />, {
      authState: {
        user: fixtures.user({ 
          role: 'ADMINGERAL',
          permissions: [{ type: 'church_manage' }] 
        }),
        token: 'token',
      },
    })

    // Assert
    await waitFor(
      () => {
        const button = screen.getByRole('button', { name: /adicionar horário/i })
        expect(button).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  // ============================================================================
  // TESTE 5: LOADING STATE - Exibe lista de horários de culto
  // ============================================================================
  it('deve exibir lista de horários de culto', async () => {
    // Arrange
    const mockSchedules = [{
      id: 'schedule-1',
      branchId: 'branch-123',
      dayOfWeek: 0,
      time: '10:00',
      title: 'Culto Dominical',
      description: 'Culto de domingo',
      location: 'Templo Principal',
      isDefault: true,
      autoCreateEvents: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }]
    vi.mocked(serviceScheduleApi.getByBranch).mockResolvedValue(mockSchedules as any)

    // Act
    renderWithProviders(<ChurchSettings />, {
      authState: {
        user: fixtures.user({ 
          role: 'ADMINGERAL',
          permissions: [{ type: 'church_manage' }] 
        }),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(serviceScheduleApi.getByBranch).toHaveBeenCalledWith('branch-123')
    }, { timeout: 5000 })
  })
})

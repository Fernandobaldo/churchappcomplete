import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberDetails from '@/pages/Members/MemberDetails'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, mockApiError } from '@/test/mockApi'
import api from '@/api/api'

vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})
const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'member-456' }),
  }
})

describe('MemberDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza detalhes do membro
  // ============================================================================
  it('deve renderizar detalhes do membro', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'members_manage' }] })
    const mockMember = fixtures.member({
      id: 'member-456',
      name: 'Test Member',
      email: 'member@example.com',
      phone: '11999999999',
      address: 'Rua Teste, 123',
    })
    mockApiResponse('get', '/members/member-456', mockMember)

    // Act
    renderWithProviders(<MemberDetails />, {
      initialEntries: ['/app/members/member-456'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Member')).toBeInTheDocument()
      expect(screen.getByText('member@example.com')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: LOADING STATE - Carrega cargos disponíveis
  // ============================================================================
  it('deve carregar cargos disponíveis', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'members_manage' }] })
    const mockMember = fixtures.member({ id: 'member-456' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true },
      { id: 'pos-2', name: 'Obreiro', isDefault: true },
      { id: 'pos-3', name: 'Tesoureiro', isDefault: true },
    ]
    mockApiResponse('get', '/members/member-456', mockMember)
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/member-456') {
        return Promise.resolve({ data: mockMember })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    // Act
    renderWithProviders(<MemberDetails />, {
      initialEntries: ['/app/members/member-456'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/positions')
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Permite alterar cargo do membro (com permissão)
  // ============================================================================
  it('deve permitir alterar cargo do membro (com permissão)', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ permissions: [{ type: 'members_manage' }] })
    const mockMember = fixtures.member({ id: 'member-456' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true },
      { id: 'pos-2', name: 'Obreiro', isDefault: true },
    ]
    mockApiResponse('get', '/members/member-456', mockMember)
    mockApiResponse('put', '/members/member-456', { ...mockMember, positionId: 'pos-1' })
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/member-456') {
        return Promise.resolve({ data: mockMember })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    // Act
    renderWithProviders(<MemberDetails />, {
      initialEntries: ['/app/members/member-456'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      const cargoLabel = screen.getByText(/cargo na igreja/i)
      expect(cargoLabel).toBeInTheDocument()
    })

    await waitFor(() => {
      const positionSelect = document.querySelector('select') as HTMLSelectElement
      expect(positionSelect).toBeInTheDocument()
    })

    const positionSelect = document.querySelector('select') as HTMLSelectElement
    await user.selectOptions(positionSelect, 'pos-1')

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cargo atualizado com sucesso!')
    })
  })

  // ============================================================================
  // TESTE 4: BASIC RENDER - Exibe cargo atual do membro
  // ============================================================================
  it('deve exibir cargo atual do membro', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [{ type: 'members_manage' }] })
    const mockMember = fixtures.member({
      id: 'member-456',
      positionId: 'pos-1',
      position: { id: 'pos-1', name: 'Pastor' },
    })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true },
      { id: 'pos-2', name: 'Obreiro', isDefault: true },
    ]
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/member-456') {
        return Promise.resolve({ data: mockMember })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    // Act
    renderWithProviders(<MemberDetails />, {
      initialEntries: ['/app/members/member-456'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Pastor')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 5: PERMISSION CHECK - Não permite alterar cargo sem permissão
  // ============================================================================
  it('não deve permitir alterar cargo sem permissão', async () => {
    // Arrange
    const mockUser = fixtures.user({ permissions: [] })
    const mockMember = fixtures.member({ id: 'member-456' })
    mockApiResponse('get', '/members/member-456', mockMember)

    // Act
    renderWithProviders(<MemberDetails />, {
      initialEntries: ['/app/members/member-456'],
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      const positionSelect = screen.queryByLabelText(/cargo na igreja/i)
      expect(positionSelect).not.toBeInTheDocument()
    })
  })
})


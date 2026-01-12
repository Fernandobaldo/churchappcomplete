import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Branches from '@/pages/onboarding/Branches'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse } from '@/test/mockApi'

vi.mock('@/api/api', async () => {
  const { apiMock } = await import('@/test/apiMock')
  return { default: apiMock }
})
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Branches - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza formulário com filial padrão
  // ============================================================================
  it('deve renderizar formulário com filial padrão', async () => {
    // Arrange
    mockApiResponse('get', '/churches', [{ id: 'church-123', name: 'Igreja Teste' }])
    mockApiResponse('get', '/branches', [])

    // Act
    renderWithProviders(<Branches />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/filial 1/i)).toBeInTheDocument()
      expect(screen.getByText(/principal/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Permite adicionar múltiplas filiais
  // ============================================================================
  it('deve permitir adicionar múltiplas filiais', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiResponse('get', '/churches', [{ id: 'church-123' }])
    mockApiResponse('get', '/branches', [])

    // Act
    renderWithProviders(<Branches />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/adicionar outra filial/i)).toBeInTheDocument()
    })

    const addButton = screen.getByText(/adicionar outra filial/i)
    await user.click(addButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/filial 2/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria filiais ao submeter
  // ============================================================================
  it('deve criar filiais ao submeter', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiResponse('get', '/churches', [{ id: 'church-123' }])
    mockApiResponse('get', '/branches', [])
    mockApiResponse('post', '/branches', { id: 'branch-123' })

    // Act
    renderWithProviders(<Branches />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/nome da filial/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome da filial/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Filial Centro')

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    })
  })

  // ============================================================================
  // TESTE 4: VALIDATION - Valida nome obrigatório
  // ============================================================================
  it('deve validar nome obrigatório', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiResponse('get', '/churches', [{ id: 'church-123' }])
    mockApiResponse('get', '/branches', [])

    // Act
    renderWithProviders(<Branches />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/nome da filial/i)
      expect(nameInput).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome da filial/i)
    await user.clear(nameInput)

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    // Assert
    expect(nameInput).toBeInvalid()
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para settings após criar filiais
  // ============================================================================
  it('deve navegar para settings após criar filiais', async () => {
    // Arrange
    const user = userEvent.setup()
    mockApiResponse('get', '/churches', [{ id: 'church-123' }])
    mockApiResponse('get', '/branches', [])
    mockApiResponse('post', '/branches', { id: 'branch-123' })

    // Act
    renderWithProviders(<Branches />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/nome da filial/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome da filial/i)
    await user.type(nameInput, 'Filial Teste')

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    })
  })
})

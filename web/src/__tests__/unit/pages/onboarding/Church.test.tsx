import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Church from '@/pages/onboarding/Church'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse, resetApiMocks } from '@/test/mockApi'

vi.mock('@/api/api')
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Church - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('onboarding_structure', 'simple')
    // Mock da chamada API /churches que é feita no useEffect do componente
    mockApiResponse('get', '/churches', [])
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza o formulário de criação de igreja
  // ============================================================================
  it('deve renderizar o formulário de criação de igreja', async () => {
    // Arrange & Act
    renderWithProviders(<Church />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Assert - Aguardar formulário renderizar após useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })
    
    expect(screen.getByLabelText(/país/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: VALIDATION - Valida campos obrigatórios
  // ============================================================================
  it('deve validar campos obrigatórios', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    renderWithProviders(<Church />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Aguardar formulário renderizar após useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/nome da igreja é obrigatório/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Cria igreja com sucesso
  // ============================================================================
  it('deve criar igreja com sucesso', async () => {
    // Arrange
    const user = userEvent.setup()
    // Mock todas as chamadas de API (incluindo /churches do useEffect que já está no beforeEach)
    mockApiResponse('get', '/countries', [])
    mockApiResponse('post', '/churches', {
      church: { id: 'church-123', name: 'Igreja Teste' },
      token: 'new-token',
    })
    mockApiResponse('post', '/onboarding/progress/church', { success: true })

    // Act
    renderWithProviders(<Church />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Aguardar formulário renderizar após useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    // Assert - Aguardar navegação após submit com timeout adequado
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    }, { timeout: 3000 })
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Navega para branches se estrutura for com filiais
  // ============================================================================
  it('deve navegar para branches se estrutura for com filiais', async () => {
    // Arrange
    localStorage.clear()
    localStorage.setItem('onboarding_structure', 'branches')
    const user = userEvent.setup()
    // Mock todas as chamadas de API (incluindo /churches do useEffect)
    mockApiResponse('get', '/churches', [])
    mockApiResponse('get', '/countries', [])
    mockApiResponse('post', '/churches', {
      church: { id: 'church-123' },
    })
    mockApiResponse('post', '/onboarding/progress/church', { success: true })

    // Act
    renderWithProviders(<Church />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Aguardar formulário renderizar após useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Assert - Aguardar navegação após submit com timeout adequado
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/branches')
    }, { timeout: 3000 })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Navega para settings após criar igreja simples
  // ============================================================================
  it('deve navegar para settings após criar igreja simples', async () => {
    // Arrange
    localStorage.clear()
    localStorage.setItem('onboarding_structure', 'simple')
    const user = userEvent.setup()
    // Mock todas as chamadas de API (incluindo /churches do useEffect)
    mockApiResponse('get', '/churches', [])
    mockApiResponse('get', '/countries', [])
    mockApiResponse('post', '/churches', {
      church: { id: 'church-123' },
    })
    mockApiResponse('post', '/onboarding/progress/church', { success: true })

    // Act
    renderWithProviders(<Church />, {
      authState: {
        user: fixtures.user(),
        token: 'token',
      },
    })

    // Aguardar formulário renderizar após useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Assert - Aguardar navegação após submit com timeout adequado
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    }, { timeout: 3000 })
  })
})

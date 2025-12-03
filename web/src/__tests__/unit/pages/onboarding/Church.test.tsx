import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Church from '@/pages/onboarding/Church'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/api')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
  })),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Church - Criação de Igreja', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('onboarding_structure', 'simple')
    ;(useAuthStore as any).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    })
  })

  it('deve renderizar o formulário de criação de igreja', () => {
    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/país/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/idioma padrão/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cor principal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nome da igreja é obrigatório/i)).toBeInTheDocument()
    })
  })

  it('deve criar igreja com sucesso', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      data: {
        church: { id: 'church-123', name: 'Igreja Teste' },
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/churches', expect.objectContaining({
        name: 'Igreja Teste',
        withBranch: true,
        branchName: 'Sede',
      }))
    })
  })

  it('deve criar igreja com todos os campos opcionais', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      data: {
        church: { id: 'church-123', name: 'Igreja Completa' },
      },
    }

    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Completa')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Teste, 123')
    await user.type(screen.getByLabelText(/telefone/i), '(11) 99999-9999')
    await user.type(screen.getByLabelText(/email/i), 'contato@igreja.com')
    await user.type(screen.getByLabelText(/website/i), 'https://www.igreja.com')
    await user.type(screen.getByLabelText(/facebook/i), 'https://facebook.com/igreja')
    await user.type(screen.getByLabelText(/instagram/i), 'https://instagram.com/igreja')

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/churches', expect.objectContaining({
        name: 'Igreja Completa',
        address: 'Rua Teste, 123',
        phone: '(11) 99999-9999',
        email: 'contato@igreja.com',
        website: 'https://www.igreja.com',
        socialMedia: expect.objectContaining({
          facebook: 'https://facebook.com/igreja',
          instagram: 'https://instagram.com/igreja',
        }),
      }))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    })
  })

  it('deve navegar para branches se estrutura for com filiais', async () => {
    // Limpa e configura o localStorage ANTES de renderizar
    localStorage.clear()
    localStorage.setItem('onboarding_structure', 'branches')
    const user = userEvent.setup()

    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockResolvedValue({
      data: { church: { id: 'church-123' } },
    })

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/branches')
    })
  })

  it('deve carregar dados da igreja existente quando usuário tem branchId', async () => {
    const mockChurches = [
      { 
        id: 'church-123', 
        name: 'Igreja Existente', 
        logoUrl: 'https://example.com/logo.png',
        Branch: [{ id: 'branch-123', name: 'Sede' }],
      },
    ]

    ;(useAuthStore as any).mockReturnValue({
      user: { 
        id: 'user-123', 
        email: 'test@example.com',
        branchId: 'branch-123',
      },
    })

    vi.mocked(api.get).mockResolvedValue({ data: mockChurches })

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/churches')
    })

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/nome da igreja/i) as HTMLInputElement
      expect(nameInput.value).toBe('Igreja Existente')
    })
  })

  it('não deve carregar dados quando usuário não tem igreja configurada (array vazio)', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: { 
        id: 'user-123', 
        email: 'test@example.com',
        branchId: null,
      },
    })

    vi.mocked(api.get).mockResolvedValue({ data: [] })

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/churches')
    })

    // O formulário deve estar vazio
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/nome da igreja/i) as HTMLInputElement
      expect(nameInput.value).toBe('')
    })
  })

  it('deve usar a igreja correta do usuário quando há múltiplas igrejas', async () => {
    const mockChurches = [
      { 
        id: 'church-other', 
        name: 'Igreja de Outro Usuário',
        Branch: [{ id: 'branch-other', name: 'Sede' }],
      },
      { 
        id: 'church-123', 
        name: 'Igreja do Usuário',
        Branch: [{ id: 'branch-123', name: 'Sede' }],
      },
    ]

    ;(useAuthStore as any).mockReturnValue({
      user: { 
        id: 'user-123', 
        email: 'test@example.com',
        branchId: 'branch-123',
      },
    })

    vi.mocked(api.get).mockResolvedValue({ data: mockChurches })

    render(
      <MemoryRouter>
        <Church />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/churches')
    })

    // Deve carregar a igreja correta (a que tem a branch do usuário)
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/nome da igreja/i) as HTMLInputElement
      expect(nameInput.value).toBe('Igreja do Usuário')
    })
  })
})


import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import InviteLinks from '@/pages/Members/InviteLinks'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUserWithBranch = {
  ...mockUser,
  branchId: 'branch-123',
}

describe('InviteLinks - Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockUserWithBranch })
  })

  afterEach(() => {
    cleanup()
  })

  it('deve exibir modal de upgrade quando limite de plano for atingido', async () => {
    const user = userEvent.setup()

    // Mock da resposta de erro com PLAN_LIMIT_REACHED
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
          message: 'Limite de membros do plano atingido',
        },
      },
    })

    // Mock da busca do plano atual
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    // Preencher formulário e submeter
    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Aguardar modal de upgrade aparecer
    await waitFor(() => {
      expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    })

    // Verificar que o modal de upgrade está visível
    expect(screen.getByText(/Seu plano atual atingiu o limite de membros/)).toBeInTheDocument()
    // Usar getAllByText e verificar que pelo menos um existe, já que "Free" aparece múltiplas vezes
    const freeElements = screen.getAllByText('Free')
    expect(freeElements.length).toBeGreaterThan(0)
    expect(screen.getByText('Básico')).toBeInTheDocument()
  })

  it('deve fechar modal de upgrade ao clicar em fechar', async () => {
    const user = userEvent.setup()

    // Mock da resposta de erro
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
        },
      },
    })

    // Mock da busca do plano atual
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Aguardar modal aparecer
    await waitFor(() => {
      expect(screen.getByText('Upgrade do Plano')).toBeInTheDocument()
    })

    // Fechar modal - o botão de fechar pode não ter um nome acessível, então vamos procurar pelo ícone X ou pelo botão sem nome que está no header
    const closeButtons = screen.getAllByRole('button')
    // Procurar pelo botão que não tem nome (geralmente é o botão de fechar com ícone)
    const closeButton = closeButtons.find(button => {
      const buttonText = button.textContent || ''
      return buttonText === '' || buttonText.trim() === ''
    })
    if (closeButton) {
      await user.click(closeButton)
    } else {
      // Se não encontrar, tentar encontrar pelo aria-label ou testid
      const closeByAria = screen.queryByRole('button', { name: /fechar|close/i })
      if (closeByAria) {
        await user.click(closeByAria)
      }
    }

    // Verificar que o modal foi fechado
    await waitFor(() => {
      expect(screen.queryByText('Upgrade do Plano')).not.toBeInTheDocument()
    })
  })

  it('deve mostrar toast de erro quando limite for atingido', async () => {
    const toast = await import('react-hot-toast')
    const user = userEvent.setup()

    // Mock da resposta de erro
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          code: 'PLAN_LIMIT_REACHED',
          error: 'PLAN_LIMIT_REACHED',
          message: 'Limite atingido',
        },
      },
    })

    // Mock da busca do plano atual
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        plan: {
          name: 'Free',
          maxMembers: 10,
        },
      },
    } as any)

    // Mock da listagem de links
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <InviteLinks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Carregando')).not.toBeInTheDocument()
    })

    // Usar getByRole para encontrar o botão especificamente
    const createButton = screen.getByRole('button', { name: /Novo Link de Convite/i })
    await user.click(createButton)

    const createLinkButton = screen.getByRole('button', { name: /Criar Link/i })
    await user.click(createLinkButton)

    // Verificar que toast de erro foi chamado
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith(
        expect.stringContaining('Limite de membros do plano atingido')
      )
    })
  })
})


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/api'
import Start from '@/pages/onboarding/Start'
import Church from '@/pages/onboarding/Church'
import Branches from '@/pages/onboarding/Branches'
import Settings from '@/pages/onboarding/Settings'
import Concluido from '@/pages/onboarding/Concluido'

vi.mock('@/api/api')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: '',
      branchId: '',
      permissions: [],
    },
    token: 'test-token',
  })),
}))
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    type: 'user',
    role: null,
    branchId: null,
    permissions: [],
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

describe('Onboarding Flow - Integração Completa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Mock do useAuthStore retorna os valores corretos
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: '',
        branchId: '',
        permissions: [],
      },
      token: 'test-token',
    })
  })

  it('deve completar fluxo completo: estrutura simples', async () => {
    const user = userEvent.setup()

    // Mock das respostas da API
    // api.get será chamado múltiplas vezes (churches, events, etc)
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: { church: { id: 'church-123', name: 'Igreja Teste' } },
      })
      .mockResolvedValueOnce({ data: { id: 'event-123' } })
      .mockResolvedValueOnce({ data: { id: 'contrib-123' } })

    // Renderiza Start
    const { rerender, unmount: unmountStart } = render(
      <MemoryRouter initialEntries={['/onboarding/start']}>
        <Routes>
          <Route path="/onboarding/start" element={<Start />} />
        </Routes>
      </MemoryRouter>
    )

    // Step 1: Escolhe estrutura simples
    const simpleOption = screen.getByText('Criar uma igreja').closest('button')
    await user.click(simpleOption!)
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    })

    // Step 2: Cria igreja
    // Garante que o mock da API está configurado antes de renderizar
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    
    // Garante que o mock do useAuthStore está configurado
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: '',
        branchId: '',
        permissions: [],
      },
      token: 'test-token',
    })
    
    // Desmonta o componente Start antes de renderizar Church
    unmountStart()
    
    // Renderiza o componente Church diretamente
    const { unmount: unmountChurch } = render(
      <MemoryRouter initialEntries={['/onboarding/church']}>
        <Routes>
          <Route path="/onboarding/church" element={<Church />} />
        </Routes>
      </MemoryRouter>
    )

    // Aguarda o componente renderizar e o useEffect completar
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
    }, { timeout: 5000 })

    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/churches', expect.any(Object))
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/settings')
    })

    // Step 3: Configurações (Roles, Módulos e Convites)
    // Desmonta o componente Church e aguarda um pouco antes de renderizar Settings
    unmountChurch()
    await new Promise(resolve => setTimeout(resolve, 50))

    // Renderiza Settings em um novo container
    const { container } = render(
      <MemoryRouter initialEntries={['/onboarding/settings']}>
        <Routes>
          <Route path="/onboarding/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const step1Elements = screen.getAllByText(/roles e permissões/i)
      expect(step1Elements.length).toBeGreaterThan(0)
    }, { timeout: 2000 })

    // Cria roles
    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Aguarda um pouco para garantir que o estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100))

    // Seleciona módulos - pega o último botão "Continuar" (do step 2)
    await new Promise(resolve => setTimeout(resolve, 100))
    const continueButtons = screen.getAllByRole('button', { name: /continuar/i })
    const step2ContinueButton = continueButtons[continueButtons.length - 1]
    await user.click(step2ContinueButton)
    
    await waitFor(() => {
      const inviteElements = screen.getAllByText(/enviar convites/i)
      expect(inviteElements.length).toBeGreaterThan(0)
      // Verifica que o título principal está presente
      expect(inviteElements.some(el => el.tagName === 'H2')).toBe(true)
    }, { timeout: 2000 })

    // Pula convites
    await user.click(screen.getByRole('button', { name: /pular/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard')
    })
  })

  it('deve completar fluxo com estrutura de filiais', async () => {
    const user = userEvent.setup()

    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] }) // churches
      .mockResolvedValueOnce({ data: [] }) // branches
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: { church: { id: 'church-123' } },
      })
      .mockResolvedValueOnce({ data: { id: 'branch-1' } })
      .mockResolvedValueOnce({ data: { id: 'branch-2' } })

    // Start - escolhe com filiais
    render(
      <MemoryRouter initialEntries={['/onboarding/start']}>
        <Routes>
          <Route path="/onboarding/start" element={<Start />} />
        </Routes>
      </MemoryRouter>
    )

    const branchesOption = screen.getByText('Criar igreja com filiais').closest('button')
    await user.click(branchesOption!)
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(localStorage.getItem('onboarding_structure')).toBe('branches')
    })
  })

  it('deve salvar dados no localStorage durante o fluxo', async () => {
    const user = userEvent.setup()

    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockResolvedValue({
      data: { church: { id: 'church-123' } },
    })

    render(
      <MemoryRouter initialEntries={['/onboarding/start']}>
        <Routes>
          <Route path="/onboarding/start" element={<Start />} />
        </Routes>
      </MemoryRouter>
    )

    // Escolhe estrutura
    const simpleOption = screen.getByText('Criar uma igreja').closest('button')
    await user.click(simpleOption!)
    
    // Aguarda um pouco para o estado ser atualizado
    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      expect(continueButton).not.toBeDisabled()
    })
    
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    }, { timeout: 3000 })

    // Verifica localStorage após a navegação
    expect(localStorage.getItem('onboarding_structure')).toBe('simple')
  })
})


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from '@/pages/onboarding/Settings'
import api from '@/api/api'

vi.mock('@/api/api')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Settings - Wizard de Configurações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('deve renderizar o step 1 (Roles e Permissões)', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    // Usa getAllByText porque há múltiplos elementos com esse texto (indicador de progresso e título)
    const step1Elements = screen.getAllByText(/roles e permissões/i)
    expect(step1Elements.length).toBeGreaterThan(0)
    
    expect(screen.getByText(/administrador geral/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar roles/i })).toBeInTheDocument()
  })

  it('deve avançar para step 2 após criar roles', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    const createRolesButton = screen.getByRole('button', { name: /criar roles/i })
    await user.click(createRolesButton)

    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    })
  })

  it('deve permitir selecionar/deselecionar módulos no step 2', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    // Avança para step 2
    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    })

    // Verifica módulos
    const eventsCheckbox = screen.getByLabelText(/eventos/i)
    expect(eventsCheckbox).toBeChecked()

    await user.click(eventsCheckbox)
    expect(eventsCheckbox).not.toBeChecked()

    await user.click(eventsCheckbox)
    expect(eventsCheckbox).toBeChecked()
  })

  it('deve avançar para step 3 (Convites) após selecionar módulos', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    // Step 1
    await user.click(screen.getByRole('button', { name: /criar roles/i }))
    await waitFor(() => {
      expect(screen.getByText(/ativar módulos/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Step 2 - Aguarda um pouco para garantir que o estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Pega todos os botões "Continuar" e clica no que está no step 2 (o último)
    const continueButtons = screen.getAllByRole('button', { name: /continuar/i })
    const step2ContinueButton = continueButtons[continueButtons.length - 1]
    await user.click(step2ContinueButton)

    await waitFor(() => {
      const inviteElements = screen.getAllByText(/enviar convites/i)
      expect(inviteElements.length).toBeGreaterThan(0)
      // Verifica que o título principal está presente
      expect(inviteElements.some(el => el.tagName === 'H2')).toBe(true)
    }, { timeout: 2000 })
  })

  it('deve mostrar progresso visual dos steps', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    // Verifica que step 1 está ativo (usa getAllByText e pega o primeiro, que é o título)
    const step1Titles = screen.getAllByText(/roles e permissões/i)
    expect(step1Titles.length).toBeGreaterThan(0)
    // Verifica que o título principal está presente
    expect(step1Titles.some(el => el.tagName === 'H2')).toBe(true)
  })
})


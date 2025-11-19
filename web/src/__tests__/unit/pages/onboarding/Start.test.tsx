import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Start from '@/pages/onboarding/Start'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Start - Escolha de Estrutura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('deve renderizar as três opções de estrutura', () => {
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    expect(screen.getByText('Criar uma igreja')).toBeInTheDocument()
    expect(screen.getByText('Criar igreja com filiais')).toBeInTheDocument()
    expect(screen.getByText('Entrar em uma igreja existente')).toBeInTheDocument()
  })

  it('deve permitir selecionar estrutura simples', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    const simpleOption = screen.getByText('Criar uma igreja').closest('button')
    expect(simpleOption).toBeInTheDocument()

    await user.click(simpleOption!)

    // Verifica se o botão continuar está habilitado
    const continueButton = screen.getByRole('button', { name: /continuar/i })
    expect(continueButton).not.toBeDisabled()

    await user.click(continueButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    }, { timeout: 2000 })

    // Verifica localStorage após a navegação
    expect(localStorage.getItem('onboarding_structure')).toBe('simple')
  })

  it('deve permitir selecionar estrutura com filiais', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    const branchesOption = screen.getByText('Criar igreja com filiais').closest('button')
    expect(branchesOption).toBeInTheDocument()

    await user.click(branchesOption!)

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/church')
    }, { timeout: 2000 })

    // Verifica localStorage após a navegação
    expect(localStorage.getItem('onboarding_structure')).toBe('branches')
  })

  it('deve mostrar alerta ao selecionar entrar em igreja existente', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    const existingOption = screen.getByText('Entrar em uma igreja existente').closest('button')
    await user.click(existingOption!)

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Funcionalidade de entrar em igreja existente será implementada em breve.')
    })

    alertSpy.mockRestore()
  })

  it('deve desabilitar botão continuar quando nenhuma opção está selecionada', () => {
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    const continueButton = screen.getByRole('button', { name: /continuar/i })
    expect(continueButton).toBeDisabled()
  })

  it('deve navegar de volta ao clicar em voltar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    )

    const backButton = screen.getByRole('button', { name: /voltar/i })
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/bem-vindo')
  })
})


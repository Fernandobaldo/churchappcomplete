import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Branches from '@/pages/onboarding/Branches'
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

describe('Branches - Criação de Filiais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar formulário com filial padrão', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 'church-123', name: 'Igreja Teste' }] })
      .mockResolvedValueOnce({ data: [] })

    render(
      <MemoryRouter>
        <Branches />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/filial 1/i)).toBeInTheDocument()
      expect(screen.getByText(/principal/i)).toBeInTheDocument()
    })
  })

  it('deve permitir adicionar múltiplas filiais', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 'church-123' }] })
      .mockResolvedValueOnce({ data: [] })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Branches />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/adicionar outra filial/i)).toBeInTheDocument()
    })

    const addButton = screen.getByText(/adicionar outra filial/i)
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/filial 2/i)).toBeInTheDocument()
    })
  })

  it('deve permitir remover filiais (exceto a primeira)', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 'church-123' }] })
      .mockResolvedValueOnce({ data: [] })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Branches />
      </MemoryRouter>
    )

    // Adiciona uma filial
    await waitFor(() => {
      expect(screen.getByText(/adicionar outra filial/i)).toBeInTheDocument()
    })
    await user.click(screen.getByText(/adicionar outra filial/i))

    // Verifica que aparece botão de remover
    await waitFor(() => {
      const removeButtons = screen.getAllByRole('button', { name: '' })
      expect(removeButtons.length).toBeGreaterThan(0)
    })
  })

  it('deve criar filiais ao submeter', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 'church-123' }] })
      .mockResolvedValueOnce({ data: [] })
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'branch-123' } })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Branches />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/nome da filial/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome da filial/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Filial Centro')

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/branches', expect.objectContaining({
        name: 'Filial Centro',
        churchId: 'church-123',
      }))
    })
  })

  it('deve validar nome obrigatório', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 'church-123' }] })
      .mockResolvedValueOnce({ data: [] })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Branches />
      </MemoryRouter>
    )

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/nome da filial/i)
      expect(nameInput).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome da filial/i)
    await user.clear(nameInput)

    const submitButton = screen.getByRole('button', { name: /continuar/i })
    await user.click(submitButton)

    // HTML5 validation deve impedir submit
    expect(nameInput).toBeInvalid()
  })
})


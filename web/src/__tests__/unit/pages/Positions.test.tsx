import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Positions from '@/pages/Positions'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockAdminUser = {
  id: 'user-123',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMINGERAL',
  memberId: 'member-123',
}

const mockPositions = [
  { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
  { id: 'pos-2', name: 'Obreiro', isDefault: true, _count: { Members: 5 } },
  { id: 'pos-3', name: 'Tesoureiro', isDefault: true, _count: { Members: 1 } },
  { id: 'pos-4', name: 'Diácono', isDefault: false, _count: { Members: 3 } },
]

describe('Positions - Gerenciamento de Cargos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: mockAdminUser,
      token: 'mock-token',
    })

    vi.mocked(api.get).mockResolvedValue({
      data: mockPositions,
    })
  })

  it('deve renderizar lista de cargos', async () => {
    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/cargos da igreja/i)).toBeInTheDocument()
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
      expect(screen.getByText(/obreiro/i)).toBeInTheDocument()
    })
  })

  it('deve permitir criar novo cargo (ADMINGERAL)', async () => {
    const user = userEvent.setup()

    vi.mocked(api.post).mockResolvedValue({
      data: { id: 'pos-5', name: 'Músico', isDefault: false },
    })

    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: diácono, músico/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(/ex: diácono, músico/i)
    await user.type(nameInput, 'Músico')

    const submitButton = screen.getByRole('button', { name: /criar cargo/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/positions', { name: 'Músico' })
      expect(toast.success).toHaveBeenCalledWith('Cargo criado com sucesso!')
    })
  })

  it('deve permitir editar cargo customizado', async () => {
    const user = userEvent.setup()

    vi.mocked(api.put).mockResolvedValue({
      data: { id: 'pos-4', name: 'Diácono Atualizado', isDefault: false },
    })

    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/diácono/i)).toBeInTheDocument()
    })

    // Encontrar botão de editar do cargo customizado
    // O botão de editar é o primeiro botão na linha do Diácono (que não é padrão)
    const diaconoRow = screen.getByText(/diácono/i).closest('[class*="border"]')
    expect(diaconoRow).toBeInTheDocument()
    
    const buttons = diaconoRow!.querySelectorAll('button')
    // O primeiro botão é o de editar (ícone Edit)
    const editButton = buttons[0]
    expect(editButton).toBeInTheDocument()
    
    await user.click(editButton!)

    // Aguardar input de edição aparecer
    await waitFor(() => {
      const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
      expect(editInput).toBeInTheDocument()
    })

    const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
    await user.clear(editInput)
    await user.type(editInput, 'Diácono Atualizado')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/positions/pos-4', { name: 'Diácono Atualizado' })
    })
  })

  it('deve permitir deletar cargo customizado', async () => {
    const user = userEvent.setup()

    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    // Mock do confirm
    window.confirm = vi.fn(() => true)

    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/diácono/i)).toBeInTheDocument()
    })

    // Encontrar botão de deletar do cargo customizado
    // O botão de deletar é o segundo botão na linha do Diácono (ícone Trash2)
    const diaconoRow = screen.getByText(/diácono/i).closest('[class*="border"]')
    expect(diaconoRow).toBeInTheDocument()
    
    const buttons = diaconoRow!.querySelectorAll('button')
    // O segundo botão é o de deletar (ícone Trash2)
    const deleteButton = buttons[1]
    expect(deleteButton).toBeInTheDocument()
    
    await user.click(deleteButton!)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/positions/pos-4')
      expect(toast.success).toHaveBeenCalledWith('Cargo deletado com sucesso!')
    })
  })

  it('não deve permitir editar/deletar cargos padrão', async () => {
    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
    })

    // Verificar que cargos padrão não têm botões de editar/deletar
    const pastorRow = screen.getByText(/pastor/i).closest('[class*="border"]')
    if (pastorRow) {
      const editButtons = pastorRow.querySelectorAll('button')
      // Cargos padrão não devem ter botões de ação
      expect(editButtons.length).toBe(0)
    }
  })

  it('deve mostrar mensagem quando não é admin', async () => {
    useAuthStore.setState({
      user: { ...mockAdminUser, role: 'MEMBER' },
      token: 'mock-token',
    })

    render(
      <MemoryRouter>
        <Positions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/apenas administradores podem gerenciar cargos/i)).toBeInTheDocument()
    })
  })
})


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Positions from '@/pages/Positions'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse } from '@/test/mockApi'

vi.mock('@/api/api')
const mockToastSuccess = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}))

describe('Positions - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza lista de cargos
  // ============================================================================
  it('deve renderizar lista de cargos', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
      { id: 'pos-2', name: 'Obreiro', isDefault: true, _count: { Members: 5 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/cargos da igreja/i)).toBeInTheDocument()
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
      expect(screen.getByText(/obreiro/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Permite criar novo cargo (ADMINGERAL)
  // ============================================================================
  it('deve permitir criar novo cargo (ADMINGERAL)', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)
    mockApiResponse('post', '/positions', { id: 'pos-5', name: 'Músico', isDefault: false })

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: diácono, músico/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(/ex: diácono, músico/i)
    await user.type(nameInput, 'Músico')

    const submitButton = screen.getByRole('button', { name: /criar cargo/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cargo criado com sucesso!')
    })
  })

  // ============================================================================
  // TESTE 3: PERMISSION CHECK - Não permite editar/deletar cargos padrão
  // ============================================================================
  it('não deve permitir editar/deletar cargos padrão', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
    })

    const pastorRow = screen.getByText(/pastor/i).closest('[class*="border"]')
    if (pastorRow) {
      const editButtons = pastorRow.querySelectorAll('button')
      expect(editButtons.length).toBe(0)
    }
  })

  // ============================================================================
  // TESTE 4: PERMISSION CHECK - Mostra mensagem quando não é admin
  // ============================================================================
  it('deve mostrar mensagem quando não é admin', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'MEMBER' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/apenas administradores podem gerenciar cargos/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Permite editar cargo customizado
  // ============================================================================
  it('deve permitir editar cargo customizado', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-4', name: 'Diácono', isDefault: false, _count: { Members: 3 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)
    mockApiResponse('put', '/positions/pos-4', { id: 'pos-4', name: 'Diácono Atualizado', isDefault: false })

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/diácono/i)).toBeInTheDocument()
    })

    const diaconoRow = screen.getByText(/diácono/i).closest('[class*="border"]')
    expect(diaconoRow).toBeInTheDocument()
    
    const buttons = diaconoRow!.querySelectorAll('button')
    const editButton = buttons[0]
    await user.click(editButton!)

    await waitFor(() => {
      const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
      expect(editInput).toBeInTheDocument()
    })

    const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
    await user.clear(editInput)
    await user.type(editInput, 'Diácono Atualizado')
    await user.keyboard('{Enter}')

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled()
    })
  })
})

import userEvent from '@testing-library/user-event'
import Positions from '@/pages/Positions'
import { fixtures } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { mockApiResponse } from '@/test/mockApi'

vi.mock('@/api/api')
const mockToastSuccess = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}))

describe('Positions - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza lista de cargos
  // ============================================================================
  it('deve renderizar lista de cargos', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
      { id: 'pos-2', name: 'Obreiro', isDefault: true, _count: { Members: 5 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/cargos da igreja/i)).toBeInTheDocument()
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
      expect(screen.getByText(/obreiro/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 2: PRIMARY INTERACTION - Permite criar novo cargo (ADMINGERAL)
  // ============================================================================
  it('deve permitir criar novo cargo (ADMINGERAL)', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)
    mockApiResponse('post', '/positions', { id: 'pos-5', name: 'Músico', isDefault: false })

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: diácono, músico/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(/ex: diácono, músico/i)
    await user.type(nameInput, 'Músico')

    const submitButton = screen.getByRole('button', { name: /criar cargo/i })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cargo criado com sucesso!')
    })
  })

  // ============================================================================
  // TESTE 3: PERMISSION CHECK - Não permite editar/deletar cargos padrão
  // ============================================================================
  it('não deve permitir editar/deletar cargos padrão', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
    })

    const pastorRow = screen.getByText(/pastor/i).closest('[class*="border"]')
    if (pastorRow) {
      const editButtons = pastorRow.querySelectorAll('button')
      expect(editButtons.length).toBe(0)
    }
  })

  // ============================================================================
  // TESTE 4: PERMISSION CHECK - Mostra mensagem quando não é admin
  // ============================================================================
  it('deve mostrar mensagem quando não é admin', async () => {
    // Arrange
    const mockUser = fixtures.user({ role: 'MEMBER' })
    const mockPositions = [
      { id: 'pos-1', name: 'Pastor', isDefault: true, _count: { Members: 2 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/apenas administradores podem gerenciar cargos/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Permite editar cargo customizado
  // ============================================================================
  it('deve permitir editar cargo customizado', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockUser = fixtures.user({ role: 'ADMINGERAL' })
    const mockPositions = [
      { id: 'pos-4', name: 'Diácono', isDefault: false, _count: { Members: 3 } },
    ]
    mockApiResponse('get', '/positions', mockPositions)
    mockApiResponse('put', '/positions/pos-4', { id: 'pos-4', name: 'Diácono Atualizado', isDefault: false })

    // Act
    renderWithProviders(<Positions />, {
      authState: {
        user: mockUser,
        token: 'token',
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/diácono/i)).toBeInTheDocument()
    })

    const diaconoRow = screen.getByText(/diácono/i).closest('[class*="border"]')
    expect(diaconoRow).toBeInTheDocument()
    
    const buttons = diaconoRow!.querySelectorAll('button')
    const editButton = buttons[0]
    await user.click(editButton!)

    await waitFor(() => {
      const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
      expect(editInput).toBeInTheDocument()
    })

    const editInput = diaconoRow!.querySelector('input[type="text"]') as HTMLInputElement
    await user.clear(editInput)
    await user.type(editInput, 'Diácono Atualizado')
    await user.keyboard('{Enter}')

    // Assert
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled()
    })
  })
})

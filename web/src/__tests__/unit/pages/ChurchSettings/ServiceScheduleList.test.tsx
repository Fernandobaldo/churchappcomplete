import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceScheduleList from '@/pages/ChurchSettings/ServiceScheduleList'
import { serviceScheduleApi } from '@/api/serviceScheduleApi'

vi.mock('@/api/serviceScheduleApi', () => ({
  serviceScheduleApi: {
    getRelatedEventsCount: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
    createEvents: vi.fn(),
  },
}))

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

const mockConfirm = vi.fn()
window.confirm = mockConfirm

describe('ServiceScheduleList - Unit Tests', () => {
  const mockSchedules = [
    {
      id: 'schedule-1',
      branchId: 'branch-123',
      dayOfWeek: 0,
      time: '10:00',
      title: 'Culto Dominical',
      description: 'Culto de domingo',
      location: 'Templo Principal',
      isDefault: false,
      autoCreateEvents: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'schedule-2',
      branchId: 'branch-123',
      dayOfWeek: 3,
      time: '19:00',
      title: 'Culto de Quarta',
      description: 'Culto de quarta-feira',
      location: 'Templo Principal',
      isDefault: true,
      autoCreateEvents: true,
      autoCreateDaysAhead: 90,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(false)
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderiza lista de horários
  // ============================================================================
  it('deve renderizar lista de horários', () => {
    // Arrange & Act
    render(
      <ServiceScheduleList
        schedules={mockSchedules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    // Assert
    expect(screen.getByText('Culto Dominical')).toBeInTheDocument()
    expect(screen.getByText('Culto de Quarta')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()
    expect(screen.getByText('Quarta-feira')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 2: EMPTY STATE - Mostra mensagem vazia quando não há horários
  // ============================================================================
  it('deve mostrar mensagem vazia quando não há horários', () => {
    // Arrange & Act
    render(
      <ServiceScheduleList
        schedules={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    // Assert
    expect(screen.getByText('Nenhum horário de culto cadastrado.')).toBeInTheDocument()
  })

  // ============================================================================
  // TESTE 3: PRIMARY INTERACTION - Chama onEdit quando clicar no botão de editar
  // ============================================================================
  it('deve chamar onEdit quando clicar no botão de editar', async () => {
    // Arrange
    const user = userEvent.setup()

    // Act
    render(
      <ServiceScheduleList
        schedules={mockSchedules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    const editButtons = screen.getAllByTitle('Editar')
    await user.click(editButtons[0])

    // Assert
    expect(mockOnEdit).toHaveBeenCalledWith(mockSchedules[0])
  })

  // ============================================================================
  // TESTE 4: PRIMARY INTERACTION - Deleta horário quando confirmado
  // ============================================================================
  it('deve deletar horário quando confirmado', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(serviceScheduleApi.getRelatedEventsCount).mockResolvedValue({
      count: 0,
      scheduleTitle: 'Culto Dominical',
    } as any)
    mockConfirm.mockReturnValueOnce(true)

    // Act
    render(
      <ServiceScheduleList
        schedules={[mockSchedules[0]]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    const deleteButton = screen.getByTitle('Deletar')
    await user.click(deleteButton)

    // Assert
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('schedule-1', true)
    })
  })

  // ============================================================================
  // TESTE 5: ERROR STATE - Mostra erro quando falha ao contar eventos
  // ============================================================================
  it('deve mostrar erro quando falha ao contar eventos', async () => {
    // Arrange
    const user = userEvent.setup()
    vi.mocked(serviceScheduleApi.getRelatedEventsCount).mockRejectedValue(
      new Error('Erro ao contar eventos')
    )

    // Act
    render(
      <ServiceScheduleList
        schedules={[mockSchedules[0]]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    const deleteButton = screen.getByTitle('Deletar')
    await user.click(deleteButton)

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
  })
})


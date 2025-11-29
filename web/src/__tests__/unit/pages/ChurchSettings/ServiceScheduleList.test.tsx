import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceScheduleList from '@/pages/ChurchSettings/ServiceScheduleList'
import { serviceScheduleApi } from '@/api/serviceScheduleApi'
import toast from 'react-hot-toast'

vi.mock('@/api/serviceScheduleApi', () => ({
  serviceScheduleApi: {
    getRelatedEventsCount: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
    createEvents: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock window.confirm
const mockConfirm = vi.fn()
window.confirm = mockConfirm

describe('ServiceScheduleList', () => {
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
    mockConfirm.mockReturnValue(false) // Por padrão, não confirma
  })

  it('deve renderizar lista de horários', () => {
    render(
      <ServiceScheduleList
        schedules={mockSchedules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('Culto Dominical')).toBeInTheDocument()
    expect(screen.getByText('Culto de Quarta')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()
    expect(screen.getByText('Quarta-feira')).toBeInTheDocument()
  })

  it('deve mostrar badge de padrão para horário padrão', () => {
    render(
      <ServiceScheduleList
        schedules={mockSchedules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    const defaultBadges = screen.getAllByText('Padrão')
    expect(defaultBadges.length).toBeGreaterThan(0)
  })

  it('deve chamar onEdit quando clicar no botão de editar', async () => {
    const user = userEvent.setup()
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

    expect(mockOnEdit).toHaveBeenCalledWith(mockSchedules[0])
  })

  it('deve mostrar diálogo de confirmação ao deletar horário sem eventos', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 0,
      scheduleTitle: 'Culto Dominical',
    })
    mockConfirm.mockReturnValueOnce(true) // Confirma a primeira pergunta

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

    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')
    })

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Tem certeza que deseja deletar o horário "Culto Dominical"?')
    )
    // Sempre deleta eventos (mesmo quando não há eventos, passa true)
    expect(mockOnDelete).toHaveBeenCalledWith('schedule-1', true)
  })

  it('deve mostrar diálogo informando sobre eventos relacionados', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 5,
      scheduleTitle: 'Culto Dominical',
    })
    mockConfirm.mockReturnValueOnce(true) // Confirma deletar horário (e eventos relacionados)

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

    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')
    })

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('5 evento(s) criado(s) a partir dele também serão deletados')
    )
    // Não deve mostrar segunda confirmação - sempre deleta eventos
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    // Verifica que a mensagem contém o aviso sobre eventos
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('⚠️ ATENÇÃO: Ao deletar este horário de culto, 5 evento(s) criado(s) a partir dele também serão deletados')
    )
    expect(mockOnDelete).toHaveBeenCalledWith('schedule-1', true)
  })

  it('deve deletar horário e eventos relacionados quando confirmado', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 3,
      scheduleTitle: 'Culto Dominical',
    })
    mockConfirm.mockReturnValueOnce(true) // Confirma deletar horário (e eventos relacionados)

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

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled()
    })

    // Sempre deleta eventos quando deleta o horário
    expect(mockOnDelete).toHaveBeenCalledWith('schedule-1', true)
  })

  it('não deve deletar quando usuário cancela a primeira confirmação', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 2,
      scheduleTitle: 'Culto Dominical',
    })
    // Reset mock para garantir que retorne false
    mockConfirm.mockReset()
    mockConfirm.mockReturnValue(false) // Cancela

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

    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalled()
    })

    // Aguarda um pouco para garantir que o código assíncrono seja executado
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })

    // Verifica que onDelete não foi chamado porque o usuário cancelou
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('deve mostrar erro quando falha ao contar eventos', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockRejectedValue(
      new Error('Erro ao contar eventos')
    )

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

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao verificar eventos relacionados')
      )
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('deve mostrar mensagem vazia quando não há horários', () => {
    render(
      <ServiceScheduleList
        schedules={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('Nenhum horário de culto cadastrado.')).toBeInTheDocument()
  })
})




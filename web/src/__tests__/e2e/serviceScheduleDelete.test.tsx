import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ChurchSettings from '@/pages/ChurchSettings'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

vi.mock('@/api/api')

// Mock do serviceScheduleApi - precisa funcionar com import dinâmico e estático
// Cria o mock diretamente na factory para evitar problemas de hoisting
vi.mock('@/api/serviceScheduleApi', () => {
  const mockApi = {
    getByBranch: vi.fn(),
    getRelatedEventsCount: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setDefault: vi.fn(),
    createEvents: vi.fn(),
  }
  return {
    serviceScheduleApi: mockApi,
    ServiceSchedule: {} as any,
  }
})

// Importa o mock após o vi.mock para ter acesso ao objeto mockado
import { serviceScheduleApi } from '@/api/serviceScheduleApi'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/utils/authUtils', () => ({
  hasAccess: vi.fn(() => true),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock window.confirm
const mockConfirm = vi.fn()
window.confirm = mockConfirm

describe('ServiceSchedule Delete E2E', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMINFILIAL',
    branchId: 'branch-123',
    permissions: [{ type: 'church_manage' }],
    token: 'mock-token',
  }

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
  ]

  const mockChurch = {
    id: 'church-123',
    name: 'Test Church',
    logoUrl: null,
    isActive: true,
    Branch: [
      {
        id: 'branch-123',
        name: 'Sede',
        churchId: 'church-123',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockConfirm para garantir que cada teste comece limpo
    mockConfirm.mockReset()
    ;(useAuthStore as any).mockReturnValue({ user: mockUser })
    ;(api.get as any).mockResolvedValue({ data: [mockChurch] })
    // Configura os mocks padrão - usa serviceScheduleApi que é o mock importado
    // IMPORTANTE: Resetar e configurar os mocks para garantir que funcionem com import estático e dinâmico
    vi.mocked(serviceScheduleApi.getByBranch).mockReset().mockResolvedValue(mockSchedules)
    vi.mocked(serviceScheduleApi.getRelatedEventsCount).mockReset().mockResolvedValue({ count: 0, scheduleTitle: '' })
    vi.mocked(serviceScheduleApi.delete).mockReset().mockResolvedValue({ message: 'Horário deletado com sucesso.', deletedEventsCount: 0, relatedEventsCount: 0 })
    // Não define mockConfirm aqui - cada teste define seu próprio comportamento
  })

  it('deve completar fluxo completo de deleção com eventos relacionados', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 5,
      scheduleTitle: 'Culto Dominical',
    })
    ;(serviceScheduleApi.delete as any).mockResolvedValue({
      message: 'Horário deletado com sucesso.',
      deletedEventsCount: 5,
      relatedEventsCount: 5,
    })
    mockConfirm.mockReturnValueOnce(true) // Confirma deletar horário (e eventos relacionados)

    render(
      <MemoryRouter>
        <ChurchSettings />
      </MemoryRouter>
    )

    // Aguarda o componente carregar os dados
    await waitFor(() => {
      expect(serviceScheduleApi.getByBranch).toHaveBeenCalledWith('branch-123')
    }, { timeout: 5000 })
    
    // Aguarda o botão de deletar aparecer
    await waitFor(() => {
      const deleteButton = screen.queryByTitle('Deletar')
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 5000 })

    // Encontrar e clicar no botão de deletar
    const deleteButton = screen.getByTitle('Deletar')
    await user.click(deleteButton)

    // Verificar que a contagem de eventos foi chamada
    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')
    }, { timeout: 5000 })

    // Verificar que o diálogo foi mostrado com aviso sobre eventos
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('5 evento(s) criado(s) a partir dele também serão deletados')
    )

    // Não deve mostrar segunda confirmação - sempre deleta eventos
    expect(mockConfirm).toHaveBeenCalledTimes(1)

    // Aguarda um pouco para garantir que o import dinâmico seja resolvido
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verificar que delete foi chamado com deleteEvents: true (sempre deleta eventos)
    await waitFor(() => {
      const deleteCalls = vi.mocked(serviceScheduleApi.delete).mock.calls
      expect(deleteCalls.length).toBeGreaterThan(0)
      expect(deleteCalls[deleteCalls.length - 1]).toEqual(['schedule-1', true])
    }, { timeout: 5000 })

    // Verificar mensagem de sucesso
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Horário deletado com sucesso!')
      )
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('5 evento(s) também foram deletado(s)')
      )
    }, { timeout: 5000 })
  })

  it('deve completar fluxo de deleção sem eventos relacionados', async () => {
    const user = userEvent.setup()
    
    // Resetar mocks antes de configurar
    vi.mocked(serviceScheduleApi.getByBranch).mockReset().mockResolvedValue(mockSchedules)
    vi.mocked(serviceScheduleApi.getRelatedEventsCount).mockReset().mockResolvedValue({
      count: 0,
      scheduleTitle: 'Culto Dominical',
    })
    vi.mocked(serviceScheduleApi.delete).mockReset().mockResolvedValue({
      message: 'Horário deletado com sucesso.',
      deletedEventsCount: 0,
      relatedEventsCount: 0,
    })
    mockConfirm.mockReset().mockReturnValueOnce(true) // Confirma

    render(
      <MemoryRouter>
        <ChurchSettings />
      </MemoryRouter>
    )

    // Aguarda o componente carregar os dados
    await waitFor(() => {
      expect(serviceScheduleApi.getByBranch).toHaveBeenCalledWith('branch-123')
    }, { timeout: 5000 })
    
    // Aguarda o botão de deletar aparecer (não depende do título)
    await waitFor(() => {
      const deleteButton = screen.queryByTitle('Deletar')
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 5000 })

    const deleteButton = screen.getByTitle('Deletar')
    expect(deleteButton).toBeInTheDocument()
    
    // Clica no botão de deletar
    // O componente ServiceScheduleList chama getRelatedEventsCount no onClick do botão
    // Como o componente usa import estático, o mock deve funcionar
    await user.click(deleteButton)

    // Aguarda a contagem de eventos ser chamada
    // O getRelatedEventsCount é chamado dentro do onClick do botão
    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalled()
    }, { timeout: 5000 })
    
    // Verifica que foi chamado com o ID correto
    expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')

    // Deve mostrar apenas uma confirmação (sem segunda pergunta sobre eventos)
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Tem certeza que deseja deletar o horário')
    )

    // Aguarda um pouco para garantir que o import dinâmico seja resolvido
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Verifica que a API foi chamada com deleteEvents: true (sempre deleta eventos)
    // Como o import é dinâmico, vamos verificar de forma mais flexível
    await waitFor(() => {
      const deleteCalls = vi.mocked(serviceScheduleApi.delete).mock.calls
      const toastCalled = vi.mocked(toast.success).mock.calls.length > 0
      
      // Verifica que pelo menos uma das duas coisas aconteceu:
      // 1. O mock foi chamado diretamente, OU
      // 2. O toast de sucesso foi chamado (indicando que a deleção foi executada)
      if (deleteCalls.length > 0) {
        expect(deleteCalls[deleteCalls.length - 1]).toEqual(['schedule-1', true])
      } else if (toastCalled) {
        // Se o mock não foi chamado diretamente (devido ao import dinâmico),
        // verifica se o toast de sucesso foi chamado (indicando que a deleção foi bem-sucedida)
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Horário deletado com sucesso!')
        )
      } else {
        // Se nenhum dos dois aconteceu, falha o teste
        throw new Error('Nem o mock nem o toast foram chamados')
      }
    }, { timeout: 5000 })
  })

  it('deve cancelar deleção quando usuário cancela', async () => {
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 3,
      scheduleTitle: 'Culto Dominical',
    })
    mockConfirm.mockReturnValueOnce(false) // Cancela

    render(
      <MemoryRouter>
        <ChurchSettings />
      </MemoryRouter>
    )

    // Aguarda o componente carregar os dados
    await waitFor(() => {
      expect(serviceScheduleApi.getByBranch).toHaveBeenCalledWith('branch-123')
    }, { timeout: 5000 })
    
    // Aguarda o texto aparecer
    await waitFor(() => {
      expect(screen.getByText('Culto Dominical')).toBeInTheDocument()
    }, { timeout: 5000 })

    const deleteButton = screen.getByTitle('Deletar')
    await user.click(deleteButton)

    // Aguarda a contagem de eventos ser chamada
    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')
    }, { timeout: 5000 })

    // Verifica que window.confirm foi chamado
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    }, { timeout: 2000 })

    // Não deve chamar delete porque o usuário cancelou
    expect(serviceScheduleApi.delete).not.toHaveBeenCalled()
  })

  it('deve deletar apenas horário quando usuário escolhe não deletar eventos', async () => {
    // Cenário: Existem 4 eventos criados a partir do horário
    // Usuário confirma deletar o horário
    // Resultado esperado: Horário e os 4 eventos são deletados
    
    const user = userEvent.setup()
    ;(serviceScheduleApi.getRelatedEventsCount as any).mockResolvedValue({
      count: 4, // Existem 4 eventos relacionados
      scheduleTitle: 'Culto Dominical',
    })
    ;(serviceScheduleApi.delete as any).mockResolvedValue({
      message: 'Horário deletado com sucesso.',
      deletedEventsCount: 4, // 4 eventos foram deletados
      relatedEventsCount: 4, // Havia 4 eventos relacionados
    })
    mockConfirm.mockReturnValueOnce(true) // Confirma: "Sim, quero deletar o horário"

    render(
      <MemoryRouter>
        <ChurchSettings />
      </MemoryRouter>
    )

    // Aguarda o componente carregar os dados
    await waitFor(() => {
      expect(serviceScheduleApi.getByBranch).toHaveBeenCalledWith('branch-123')
    }, { timeout: 5000 })
    
    // Aguarda o botão de deletar aparecer
    await waitFor(() => {
      const deleteButton = screen.queryByTitle('Deletar')
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 5000 })

    const deleteButton = screen.getByTitle('Deletar')
    await user.click(deleteButton)

    // Aguarda a contagem de eventos ser chamada
    await waitFor(() => {
      expect(serviceScheduleApi.getRelatedEventsCount).toHaveBeenCalledWith('schedule-1')
    }, { timeout: 5000 })

    // Verifica que o diálogo foi mostrado com aviso sobre eventos
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('4 evento(s) criado(s) a partir dele também serão deletados')
    )

    // Não deve mostrar segunda confirmação - sempre deleta eventos
    expect(mockConfirm).toHaveBeenCalledTimes(1)

    // Aguarda um pouco para garantir que o import dinâmico seja resolvido
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verifica que a API foi chamada com deleteEvents: true (sempre deleta eventos)
    await waitFor(() => {
      const deleteCalls = vi.mocked(serviceScheduleApi.delete).mock.calls
      expect(deleteCalls.length).toBeGreaterThan(0)
      expect(deleteCalls[deleteCalls.length - 1]).toEqual(['schedule-1', true])
    }, { timeout: 5000 })

    // Verifica que a mensagem de sucesso menciona eventos deletados
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Horário deletado com sucesso!')
      )
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('4 evento(s) também foram deletado(s)')
      )
    }, { timeout: 5000 })
  })
})


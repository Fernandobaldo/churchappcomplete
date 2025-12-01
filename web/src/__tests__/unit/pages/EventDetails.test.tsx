import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EventDetails from '@/pages/Events/EventDetails'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock do PermissionGuard - igual ao teste de Finances que funciona
vi.mock('@/components/PermissionGuard', () => ({
  default: ({ children, permission }: any) => {
    const { user } = useAuthStore.getState()
    if (!user) return null
    
    // Simula a lógica de hasAccess: ADMINGERAL/ADMINFILIAL têm acesso ou verifica permissões
    const hasPermission = 
      user.role === 'ADMINGERAL' || 
      user.role === 'ADMINFILIAL' ||
      user.permissions?.some((p: any) => {
        const permType = typeof p === 'object' ? p.type : p
        return permType === permission
      }) === true
    
    return hasPermission ? <>{children}</> : null
  },
}))

const mockNavigate = vi.fn()
const mockParams = { id: 'event-1' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe('EventDetails Page', () => {
  beforeEach(() => {
    // Garantir que o store está limpo e configurado antes de cada teste
    useAuthStore.setState({
      token: 'token',
      user: {
        ...mockUser,
        permissions: [{ type: 'events_manage' }], // Garantir permissão padrão
      },
    })
    vi.clearAllMocks()
  })

  it('deve renderizar detalhes do evento', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Culto de Domingo',
      description: 'Culto matutino',
      location: 'Igreja Central',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Usar IDs para ser mais robusto
      const titleElement = document.getElementById('event-title')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement?.textContent).toBe('Culto de Domingo')
      
      const descriptionElement = document.getElementById('event-description')
      expect(descriptionElement).toBeInTheDocument()
      expect(descriptionElement?.textContent).toBe('Culto matutino')
      
      expect(screen.getByText('Igreja Central')).toBeInTheDocument()
    })
  })

  it('deve exibir informações de doação quando hasDonation é true', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento com Doação',
      description: 'Descrição',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: true,
      donationReason: 'Construção do templo',
      donationLink: 'https://example.com/doacao',
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Usar IDs para ser mais robusto
      const donationSection = document.getElementById('donation-section')
      expect(donationSection).toBeInTheDocument()
      
      const donationReason = document.getElementById('donation-reason')
      expect(donationReason).toBeInTheDocument()
      expect(donationReason?.textContent).toBe('Construção do templo')
      
      const donationLink = document.getElementById('donation-link')
      expect(donationLink).toBeInTheDocument()
      expect(donationLink?.textContent).toBe('https://example.com/doacao')
    })
  })

  it('deve exibir botões de editar e excluir para usuário com permissão', async () => {
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'events_manage' }],
    }

    useAuthStore.setState({ user: adminUser })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Usar IDs para ser mais robusto
      const editButton = document.getElementById('edit-button')
      expect(editButton).not.toBeNull()
      expect(editButton).toBeInTheDocument()
      
      const deleteButton = document.getElementById('delete-button')
      expect(deleteButton).not.toBeNull()
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('deve deletar evento com confirmação', async () => {
    const toast = await import('react-hot-toast')
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'events_manage' }],
    }

    useAuthStore.setState({ user: adminUser })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento para Deletar',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })
    vi.mocked(api.delete).mockResolvedValue({})

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      const deleteButton = document.getElementById('delete-button')
      expect(deleteButton).not.toBeNull()
      expect(deleteButton).toBeInTheDocument()
    }, { timeout: 3000 })

    const deleteButton = document.getElementById('delete-button')
    expect(deleteButton).not.toBeNull()
    if (deleteButton) {
      await user.click(deleteButton)
    } else {
      // Fallback: tentar encontrar por texto
      const deleteButtonByText = screen.getByText('Excluir')
      await user.click(deleteButtonByText)
    }

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/events/event-1')
      expect(toast.default.success).toHaveBeenCalledWith('Evento excluído com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  it('deve navegar para editar ao clicar em Editar', async () => {
    const adminUser = {
      ...mockUser,
      role: 'ADMINGERAL',
      permissions: [{ type: 'events_manage' }],
    }

    // Garantir que o usuário está no store antes de renderizar
    useAuthStore.setState({ user: adminUser, token: 'token' })

    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      description: 'Descrição do evento',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    // Primeiro aguardar o evento carregar (título aparecer)
    await waitFor(() => {
      const titleElement = document.getElementById('event-title')
      expect(titleElement).not.toBeNull()
      expect(titleElement?.textContent).toBe('Evento Teste')
    }, { timeout: 3000 })

    // Depois aguardar o botão de editar aparecer
    // Verificar se o PermissionGuard renderizou os botões
    await waitFor(() => {
      const editButton = document.getElementById('edit-button')
      const editButtonByText = screen.queryByText('Editar')
      
      // O botão deve existir por ID ou por texto
      expect(editButton || editButtonByText).toBeTruthy()
    }, { timeout: 5000 })

    // Encontrar o botão de editar (priorizar ID, depois texto)
    let editButton = document.getElementById('edit-button') as HTMLButtonElement | null
    if (!editButton) {
      const editButtonByText = screen.getByText('Editar')
      editButton = editButtonByText.closest('button') as HTMLButtonElement
    }

    // Verificar que o botão foi encontrado
    expect(editButton).not.toBeNull()
    expect(editButton).toBeInTheDocument()
    
    // Clicar no botão
    await user.click(editButton!)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events/event-1/edit')
  })

  it('deve exibir erro quando falha ao carregar evento', async () => {
    const toast = await import('react-hot-toast')
    vi.mocked(api.get).mockRejectedValue(new Error('Erro ao carregar'))

    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Erro ao carregar evento')
      expect(mockNavigate).toHaveBeenCalledWith('/app/events')
    })
  })

  it('deve navegar para lista ao clicar em Voltar', async () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Evento Teste',
      location: 'Local',
      startDate: '2024-12-31T10:00:00Z',
      endDate: '2024-12-31T12:00:00Z',
      hasDonation: false,
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockEvent })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EventDetails />
      </MemoryRouter>
    )

    await waitFor(() => {
      const backButton = document.getElementById('back-button')
      expect(backButton).toBeInTheDocument()
    })

    const backButton = document.getElementById('back-button') || screen.getByText('Voltar')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app/events')
  })
})


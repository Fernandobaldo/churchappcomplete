import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MemberDetails from '@/pages/Members/MemberDetails'
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
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'user-123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMINGERAL',
      memberId: 'member-123',
      permissions: [{ type: 'members_manage' }],
    },
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

const mockAdminUser = {
  id: 'user-123',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMINGERAL',
  memberId: 'member-123',
  permissions: [{ type: 'members_manage' }],
}

const mockMember = {
  id: 'member-456',
  name: 'Test Member',
  email: 'member@example.com',
  phone: '11999999999',
  address: 'Rua Teste, 123',
  role: 'MEMBER',
  positionId: null,
  position: null,
  permissions: [],
}

const mockPositions = [
  { id: 'pos-1', name: 'Pastor', isDefault: true },
  { id: 'pos-2', name: 'Obreiro', isDefault: true },
  { id: 'pos-3', name: 'Tesoureiro', isDefault: true },
]

describe('MemberDetails - Detalhes do Membro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      user: mockAdminUser,
    })

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/member-456') {
        return Promise.resolve({ data: mockMember })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })
  })

  it('deve renderizar detalhes do membro', async () => {
    render(
      <MemoryRouter initialEntries={['/members/member-456']}>
        <Routes>
          <Route path="/members/:id" element={<MemberDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Member')).toBeInTheDocument()
      expect(screen.getByText('member@example.com')).toBeInTheDocument()
    })
  })

  it('deve carregar cargos disponíveis', async () => {
    render(
      <MemoryRouter initialEntries={['/members/member-456']}>
        <Routes>
          <Route path="/members/:id" element={<MemberDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/positions')
    })
  })

  it('deve permitir alterar cargo do membro (com permissão)', async () => {
    const user = userEvent.setup()

    vi.mocked(api.put).mockResolvedValue({
      data: { ...mockMember, positionId: 'pos-1' },
    })

    render(
      <MemoryRouter initialEntries={['/members/member-456']}>
        <Routes>
          <Route path="/members/:id" element={<MemberDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const cargoLabel = screen.getByText(/cargo na igreja/i)
      expect(cargoLabel).toBeInTheDocument()
    })

    // Aguardar o select aparecer
    await waitFor(() => {
      const positionSelect = document.querySelector('select') as HTMLSelectElement
      expect(positionSelect).toBeInTheDocument()
    })

    const positionSelect = document.querySelector('select') as HTMLSelectElement
    await user.selectOptions(positionSelect, 'pos-1')

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/members/member-456', { positionId: 'pos-1' })
      expect(toast.success).toHaveBeenCalledWith('Cargo atualizado com sucesso!')
    })
  })

  it('deve exibir cargo atual do membro', async () => {
    const memberWithPosition = {
      ...mockMember,
      positionId: 'pos-1',
      position: { id: 'pos-1', name: 'Pastor' },
    }

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/member-456') {
        return Promise.resolve({ data: memberWithPosition })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    render(
      <MemoryRouter initialEntries={['/members/member-456']}>
        <Routes>
          <Route path="/members/:id" element={<MemberDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Pastor')).toBeInTheDocument()
    })
  })

  it('não deve permitir alterar cargo sem permissão', async () => {
    ;(useAuthStore as any).mockReturnValue({
      user: { ...mockAdminUser, permissions: [] },
    })

    render(
      <MemoryRouter initialEntries={['/members/member-456']}>
        <Routes>
          <Route path="/members/:id" element={<MemberDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      // Sem permissão, não deve ter select de cargo
      const positionSelect = screen.queryByLabelText(/cargo na igreja/i)
      expect(positionSelect).not.toBeInTheDocument()
    })
  })
})


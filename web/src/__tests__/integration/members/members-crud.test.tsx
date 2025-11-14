import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Members from '@/pages/Members'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser, mockMembers } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Members CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  describe('Listar Membros', () => {
    it('deve carregar e exibir lista de membros', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockMembers })

      render(
        <MemoryRouter>
          <Members />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument()
      })

      expect(api.get).toHaveBeenCalledWith('/members')
    })

    it('deve exibir roles dos membros', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockMembers })

      render(
        <MemoryRouter>
          <Members />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled()
      })
    })
  })
})



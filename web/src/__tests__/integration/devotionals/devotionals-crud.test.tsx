import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Devotionals from '@/pages/Devotionals'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser, mockDevotionals } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Devotionals CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  describe('Listar Devocionais', () => {
    it('deve carregar e exibir lista de devocionais', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Devocional Diário')).toBeInTheDocument()
        expect(screen.getByText('Palavra de Fé')).toBeInTheDocument()
      })

      expect(api.get).toHaveBeenCalledWith('/devotionals')
    })

    it('deve exibir informações do autor', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockDevotionals })

      render(
        <MemoryRouter>
          <Devotionals />
        </MemoryRouter>
      )

      await waitFor(() => {
        const authorElements = screen.getAllByText('João Silva')
        expect(authorElements.length).toBeGreaterThan(0)
        expect(authorElements[0]).toBeInTheDocument()
      })
    })
  })
})



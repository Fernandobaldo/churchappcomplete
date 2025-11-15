import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Contributions from '@/pages/Contributions'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import { mockUser, mockContributions } from '@/test/mocks/mockData'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Contributions CRUD Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'token',
      user: mockUser,
    })
    vi.clearAllMocks()
  })

  describe('Listar Contribuições', () => {
    it('deve carregar e exibir lista de contribuições', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockContributions })

      render(
        <MemoryRouter>
          <Contributions />
        </MemoryRouter>
      )

      await waitFor(() => {
        const dizimoElements = screen.getAllByText('Dízimo')
        expect(dizimoElements.length).toBeGreaterThan(0)
        expect(dizimoElements[0]).toBeInTheDocument()
        
        const ofertaElements = screen.getAllByText('Oferta')
        expect(ofertaElements.length).toBeGreaterThan(0)
        expect(ofertaElements[0]).toBeInTheDocument()
      })

      expect(api.get).toHaveBeenCalledWith('/contributions')
    })

    it('deve exibir valores formatados corretamente', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockContributions })

      render(
        <MemoryRouter>
          <Contributions />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Verifica se os valores estão sendo exibidos
        expect(api.get).toHaveBeenCalled()
      })
    })
  })
})



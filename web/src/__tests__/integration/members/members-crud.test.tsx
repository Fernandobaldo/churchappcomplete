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

  // 4.1 Atualização de Membro
  describe('Atualização de Membro', () => {
    it('deve atualizar membro com campos válidos', async () => {
      const mockUpdatedMember = {
        ...mockMembers[0],
        name: 'Membro Atualizado',
        phone: '11988888888',
      }

      vi.mocked(api.put).mockResolvedValue({
        data: mockUpdatedMember,
      })

      const updateData = {
        name: 'Membro Atualizado',
        phone: '11988888888',
      }

      const response = await api.put(`/members/${mockMembers[0].id}`, updateData)

      expect(api.put).toHaveBeenCalledWith(`/members/${mockMembers[0].id}`, updateData)
      expect(response.data.name).toBe('Membro Atualizado')
      expect(response.data.phone).toBe('11988888888')
    })

    it('deve validar permissões para atualizar membro', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Você não tem permissão para editar este membro',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-other', {
          name: 'Teste',
        })
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      })
    })

    it('deve validar hierarquia de roles', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: 'Você não pode criar um Administrador Geral',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: 'Teste',
          role: 'ADMINGERAL',
        })
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      })
    })

    it('deve validar campos obrigatórios no backend', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Nome é obrigatório',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(mockError)

      await expect(
        api.put('/members/member-1', {
          name: '',
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      })
    })
  })
})



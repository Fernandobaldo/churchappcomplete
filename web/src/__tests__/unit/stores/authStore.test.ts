import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { jwtDecode } from 'jwt-decode'
import { mockDecodedToken } from '@/test/mocks/mockData'

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}))

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    useAuthStore.setState({ user: null, token: null })
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('setUserFromToken', () => {
    it('deve decodificar o token e definir o usuário corretamente', () => {
      const mockToken = 'mock-jwt-token'

      vi.mocked(jwtDecode).mockReturnValue(mockDecodedToken)

      useAuthStore.getState().setUserFromToken(mockToken)

      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.user).toEqual({
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'ADMINGERAL',
        branchId: 'branch-123',
        permissions: [
          { type: 'events_manage' },
          { type: 'members_manage' },
        ],
        token: mockToken,
      })
    })

    it('deve mapear permissões corretamente', () => {
      const mockToken = 'mock-token'
      const decoded = {
        ...mockDecodedToken,
        permissions: ['events_manage'],
      }

      vi.mocked(jwtDecode).mockReturnValue(decoded)

      useAuthStore.getState().setUserFromToken(mockToken)

      const user = useAuthStore.getState().user
      expect(user?.permissions).toEqual([{ type: 'events_manage' }])
    })

    it('deve lidar com array vazio de permissões', () => {
      const mockToken = 'mock-token'
      const decoded = {
        ...mockDecodedToken,
        permissions: [],
      }

      vi.mocked(jwtDecode).mockReturnValue(decoded)

      useAuthStore.getState().setUserFromToken(mockToken)

      const user = useAuthStore.getState().user
      expect(user?.permissions).toEqual([])
    })
  })

  describe('logout', () => {
    it('deve limpar usuário e token', () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          name: 'Test',
          email: 'test@example.com',
          role: 'MEMBER',
          branchId: 'branch-123',
          permissions: [],
          token: 'token',
        },
        token: 'token',
      })

      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })

  describe('setToken', () => {
    it('deve definir apenas o token', () => {
      useAuthStore.getState().setToken('new-token')

      const state = useAuthStore.getState()
      expect(state.token).toBe('new-token')
      expect(state.user).toBeNull()
    })
  })
})



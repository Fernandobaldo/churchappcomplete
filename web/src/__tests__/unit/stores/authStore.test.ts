import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { jwtDecode } from 'jwt-decode'
import { fixtures } from '@/test/fixtures'

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}))

describe('AuthStore - Unit Tests', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    useAuthStore.setState({ user: null, token: null })
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('setUserFromToken', () => {
    it('deve decodificar o token e definir o usuário corretamente', () => {
      // Arrange
      const mockToken = 'mock-jwt-token'
      const mockDecodedToken = {
        sub: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'ADMINGERAL',
        branchId: 'branch-123',
        memberId: 'member-123',
        permissions: ['events_manage', 'members_manage'],
        onboardingCompleted: true,
        iat: 1234567890,
        exp: 1234571490,
      }

      vi.mocked(jwtDecode).mockReturnValue(mockDecodedToken as any)

      // Act
      useAuthStore.getState().setUserFromToken(mockToken)

      // Assert
      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.user).toEqual({
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        role: 'ADMINGERAL',
        branchId: 'branch-123',
        memberId: 'member-123',
        permissions: [
          { type: 'events_manage' },
          { type: 'members_manage' },
        ],
        token: mockToken,
        onboardingCompleted: true,
      })
    })

    it('deve mapear permissões corretamente', () => {
      // Arrange
      const mockToken = 'mock-token'
      const mockDecodedToken = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        permissions: ['events_manage'],
        iat: 1234567890,
        exp: 1234571490,
      }

      vi.mocked(jwtDecode).mockReturnValue(mockDecodedToken as any)

      // Act
      useAuthStore.getState().setUserFromToken(mockToken)

      // Assert
      const user = useAuthStore.getState().user
      expect(user?.permissions).toEqual([{ type: 'events_manage' }])
    })

    it('deve lidar com array vazio de permissões', () => {
      // Arrange
      const mockToken = 'mock-token'
      const mockDecodedToken = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        permissions: [],
        iat: 1234567890,
        exp: 1234571490,
      }

      vi.mocked(jwtDecode).mockReturnValue(mockDecodedToken as any)

      // Act
      useAuthStore.getState().setUserFromToken(mockToken)

      // Assert
      const user = useAuthStore.getState().user
      expect(user?.permissions).toEqual([])
    })

    it('deve salvar apenas o token quando decodificação falha', () => {
      // Arrange
      const mockToken = 'invalid-token'
      vi.mocked(jwtDecode).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act
      useAuthStore.getState().setUserFromToken(mockToken)

      // Assert
      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.user).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('deve atualizar campos do usuário corretamente', () => {
      // Arrange
      const mockUser = fixtures.user({ token: 'existing-token' })
      useAuthStore.setState({
        user: mockUser,
        token: 'existing-token',
      })

      // Act
      useAuthStore.getState().updateUser({
        name: 'Nome Atualizado',
        email: 'novo@example.com',
      })

      // Assert
      const state = useAuthStore.getState()
      expect(state.user?.name).toBe('Nome Atualizado')
      expect(state.user?.email).toBe('novo@example.com')
      expect(state.user?.id).toBe(mockUser.id) // Campos não alterados permanecem
    })

    it('deve ignorar atualização se usuário não existe', () => {
      // Arrange
      useAuthStore.setState({ user: null, token: null })

      // Act
      useAuthStore.getState().updateUser({ name: 'Test' })

      // Assert
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('deve limpar usuário e token', () => {
      // Arrange
      const mockUser = fixtures.user({ token: 'existing-token' })
      useAuthStore.setState({
        user: mockUser,
        token: 'existing-token',
      })

      // Act
      useAuthStore.getState().logout()

      // Assert
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })

  describe('setToken', () => {
    it('deve definir apenas o token', () => {
      // Arrange
      useAuthStore.setState({ user: null, token: null })

      // Act
      useAuthStore.getState().setToken('new-token')

      // Assert
      const state = useAuthStore.getState()
      expect(state.token).toBe('new-token')
      expect(state.user).toBeNull()
    })
  })
})



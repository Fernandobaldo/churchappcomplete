import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { useAuthStore } from '../../../stores/authStore'
import { jwtDecode } from 'jwt-decode'
import { mockDecodedToken } from '../../../test/mocks/mockData'

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}))

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    useAuthStore.setState({ user: null, token: null })
    jest.clearAllMocks()
  })

  describe('setUserFromToken', () => {
    it('deve decodificar o token e definir o usuário corretamente', () => {
      const mockToken = 'mock-jwt-token'

      ;(jwtDecode as jest.Mock).mockReturnValue(mockDecodedToken)

      useAuthStore.getState().setUserFromToken(mockToken)

      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.user).toBeTruthy()
      expect(state.user?.id).toBe('user-123')
      expect(state.user?.name).toBe('João Silva')
      expect(state.user?.email).toBe('joao@example.com')
    })

    it('deve mapear permissões corretamente', () => {
      const mockToken = 'mock-token'
      const decoded = {
        ...mockDecodedToken,
        permissions: ['events_manage'],
      }

      ;(jwtDecode as jest.Mock).mockReturnValue(decoded)

      useAuthStore.getState().setUserFromToken(mockToken)

      const state = useAuthStore.getState()
      expect(state.user?.permissions).toEqual([{ type: 'events_manage' }])
    })

    it('deve tratar erro ao decodificar token', () => {
      const mockToken = 'invalid-token'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(jwtDecode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      useAuthStore.getState().setUserFromToken(mockToken)

      const state = useAuthStore.getState()
      // Deve salvar o token mesmo com erro
      expect(state.token).toBe(mockToken)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('deve garantir que permissions seja sempre um array', () => {
      const mockToken = 'mock-token'
      const decoded = {
        ...mockDecodedToken,
        permissions: undefined,
      }

      ;(jwtDecode as jest.Mock).mockReturnValue(decoded)

      useAuthStore.getState().setUserFromToken(mockToken)

      const state = useAuthStore.getState()
      expect(Array.isArray(state.user?.permissions)).toBe(true)
    })
  })

  describe('logout', () => {
    it('deve limpar usuário e token', () => {
      useAuthStore.setState({
        user: { id: '123', name: 'Test', email: 'test@test.com', role: 'MEMBER', branchId: 'branch-123', permissions: [], token: 'token' },
        token: 'test-token',
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







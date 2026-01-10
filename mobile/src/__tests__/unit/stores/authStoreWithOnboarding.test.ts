// Unit tests para AuthStore com onboardingCompleted
// Padrão obrigatório: 5 testes por componente/screen crítico
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { useAuthStore } from '../../../stores/authStore'
import { jwtDecode } from 'jwt-decode'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}))

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

describe('AuthStore - onboardingCompleted', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    useAuthStore.setState({ user: null, token: null })
    jest.clearAllMocks()
    AsyncStorage.clear()
  })

  // Teste 1: Basic render/functionality
  it('deve extrair onboardingCompleted do token', () => {
    const mockToken = 'mock-jwt-token'
    const mockDecoded = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      type: 'member',
      memberId: 'member-123',
      branchId: 'branch-123',
      role: 'ADMINGERAL',
      churchId: 'church-123',
      permissions: [],
      onboardingCompleted: true,
    }

    ;(jwtDecode as jest.Mock).mockReturnValue(mockDecoded)

    useAuthStore.getState().setUserFromToken(mockToken)

    const state = useAuthStore.getState()
    expect(state.user?.onboardingCompleted).toBe(true)
    expect(state.token).toBe(mockToken)
  })

  // Teste 2: Loading state (não aplicável para store)
  // Pulado - stores não têm loading states visuais

  // Teste 3: Error state + retry
  it('deve tratar erro ao decodificar token com onboardingCompleted', () => {
    const mockToken = 'invalid-token'
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(jwtDecode as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    useAuthStore.getState().setUserFromToken(mockToken)

    const state = useAuthStore.getState()
    // Deve limpar estado em caso de erro
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  // Teste 4: Empty state
  it('deve usar onboardingCompleted = false como padrão se não presente no token', () => {
    const mockToken = 'mock-token'
    const mockDecoded = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      type: 'user',
      permissions: [],
      // onboardingCompleted não presente
    }

    ;(jwtDecode as jest.Mock).mockReturnValue(mockDecoded)

    useAuthStore.getState().setUserFromToken(mockToken)

    const state = useAuthStore.getState()
    expect(state.user?.onboardingCompleted).toBe(false)
  })

  // Teste 5: Primary interaction - logout limpa AsyncStorage
  it('deve limpar AsyncStorage ao fazer logout', async () => {
    // Preencher AsyncStorage com dados de onboarding
    await AsyncStorage.setItem('onboarding_church_id', 'church-1')
    await AsyncStorage.setItem('onboarding_church_name', 'Igreja Teste')
    await AsyncStorage.setItem('onboarding_church_address', 'Endereço Teste')
    await AsyncStorage.setItem('onboarding_structure', 'branches')
    await AsyncStorage.setItem('onboarding_modules', JSON.stringify(['events']))
    await AsyncStorage.setItem('onboarding_roles_created', 'true')

    // Configurar store com usuário autenticado
    useAuthStore.setState({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMINGERAL',
        branchId: 'branch-123',
        memberId: 'member-123',
        churchId: 'church-123',
        permissions: [],
        onboardingCompleted: true,
      },
      token: 'mock-token',
    })

    // Fazer logout
    useAuthStore.getState().logout()

    // Aguardar um pouco para AsyncStorage.multiRemove completar
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verificar que dados foram limpos
    const churchId = await AsyncStorage.getItem('onboarding_church_id')
    const churchName = await AsyncStorage.getItem('onboarding_church_name')
    const structure = await AsyncStorage.getItem('onboarding_structure')

    expect(churchId).toBeNull()
    expect(churchName).toBeNull()
    expect(structure).toBeNull()

    // Verificar que store foi limpo
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  // Teste adicional: Edge case - onboardingCompleted null
  it('deve tratar onboardingCompleted null como false', () => {
    const mockToken = 'mock-token'
    const mockDecoded = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      type: 'user',
      permissions: [],
      onboardingCompleted: null,
    }

    ;(jwtDecode as jest.Mock).mockReturnValue(mockDecoded)

    useAuthStore.getState().setUserFromToken(mockToken)

    const state = useAuthStore.getState()
    expect(state.user?.onboardingCompleted).toBe(false)
  })
})


// Helpers para testes de componentes e screens mobile
import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/api'

// Mock do API client
jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

/**
 * Wrapper para renderizar componentes com providers necessários
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    navigationInitialState?: any
    authState?: {
      token?: string | null
      user?: {
        id: string
        email: string
        name: string
        role?: string
        branchId?: string
        memberId?: string
        churchId?: string | null
        permissions?: string[]
        onboardingCompleted?: boolean
      } | null
    }
    asyncStorageData?: Record<string, string>
  } & RenderOptions = {}
) {
  const {
    navigationInitialState,
    authState,
    asyncStorageData = {},
    ...renderOptions
  } = options

  // Configurar AsyncStorage mock
  if (Object.keys(asyncStorageData).length > 0) {
    AsyncStorage.getItem = jest.fn((key: string) => {
      return Promise.resolve(asyncStorageData[key] || null)
    })
    AsyncStorage.setItem = jest.fn()
    AsyncStorage.multiRemove = jest.fn()
  }

  // Configurar auth store
  if (authState) {
    useAuthStore.setState({
      token: authState.token ?? null,
      user: authState.user ?? null,
    })
  }

  // Wrapper com NavigationContainer
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <NavigationContainer initialState={navigationInitialState}>{children}</NavigationContainer>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Helper para mockar autenticação
 */
export function mockAuthState(state: {
  token?: string | null
  user?: {
    id: string
    email: string
    name: string
    role?: string
    branchId?: string
    memberId?: string
    churchId?: string | null
    permissions?: string[]
    onboardingCompleted?: boolean
  } | null
}) {
  useAuthStore.setState({
    token: state.token ?? null,
    user: state.user ?? null,
  })
}

/**
 * Helper para mockar API responses
 */
export function mockApiResponse(method: 'get' | 'post' | 'put' | 'delete', response: any) {
  ;(api[method] as jest.Mock).mockResolvedValue(response)
}

/**
 * Helper para mockar API errors
 */
export function mockApiError(method: 'get' | 'post' | 'put' | 'delete', error: any) {
  ;(api[method] as jest.Mock).mockRejectedValue(error)
}

/**
 * Helper para criar um token JWT mock
 */
export function generateMockToken(payload: {
  sub: string
  email: string
  name: string
  type?: 'user' | 'member'
  memberId?: string | null
  branchId?: string | null
  role?: string | null
  churchId?: string | null
  permissions?: string[]
  onboardingCompleted?: boolean
}): string {
  // Simula um token JWT (não é um token real, apenas para testes)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.mock-signature`
}

/**
 * Helper para decodificar token mock
 */
export function decodeMockToken(token: string): any {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Token inválido')
  }
  return JSON.parse(Buffer.from(parts[1], 'base64').toString())
}

/**
 * Helper para setup de AsyncStorage mock
 */
export function setupAsyncStorageMock(data: Record<string, string> = {}) {
  AsyncStorage.getItem = jest.fn((key: string) => {
    return Promise.resolve(data[key] || null)
  })
  AsyncStorage.setItem = jest.fn()
  AsyncStorage.multiRemove = jest.fn()
  AsyncStorage.multiGet = jest.fn((keys: string[]) => {
    return Promise.resolve(keys.map(key => [key, data[key] || null]))
  })
  AsyncStorage.removeItem = jest.fn()
  AsyncStorage.clear = jest.fn()
}

/**
 * Helper para limpar todos os mocks
 */
export function clearAllMocks() {
  jest.clearAllMocks()
  AsyncStorage.getItem = jest.fn().mockResolvedValue(null)
  AsyncStorage.setItem = jest.fn()
  AsyncStorage.multiRemove = jest.fn()
  ;(api.get as jest.Mock).mockReset()
  ;(api.post as jest.Mock).mockReset()
  ;(api.put as jest.Mock).mockReset()
  ;(api.delete as jest.Mock).mockReset()
}

/**
 * Helper para criar um usuário de teste mock
 */
export function createMockUser(options: {
  id?: string
  email?: string
  name?: string
  role?: string
  branchId?: string
  memberId?: string
  churchId?: string | null
  permissions?: string[]
  onboardingCompleted?: boolean
} = {}) {
  return {
    id: options.id || 'user-123',
    email: options.email || 'test@example.com',
    name: options.name || 'Test User',
    role: options.role || '',
    branchId: options.branchId || '',
    memberId: options.memberId,
    churchId: options.churchId || null,
    permissions: options.permissions || [],
    onboardingCompleted: options.onboardingCompleted ?? false,
  }
}

/**
 * Helper para criar dados de igreja mock
 */
export function createMockChurch(options: {
  id?: string
  name?: string
  address?: string
  createdByUserId?: string
} = {}) {
  return {
    id: options.id || 'church-123',
    name: options.name || 'Test Church',
    address: options.address || 'Test Address',
    createdByUserId: options.createdByUserId || 'user-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Helper para criar dados de branch mock
 */
export function createMockBranch(options: {
  id?: string
  name?: string
  churchId?: string
  isMainBranch?: boolean
} = {}) {
  return {
    id: options.id || 'branch-123',
    name: options.name || 'Test Branch',
    churchId: options.churchId || 'church-123',
    isMainBranch: options.isMainBranch ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Helper para criar dados de member mock
 */
export function createMockMember(options: {
  id?: string
  name?: string
  email?: string
  role?: string
  branchId?: string
  userId?: string
} = {}) {
  return {
    id: options.id || 'member-123',
    name: options.name || 'Test Member',
    email: options.email || 'member@example.com',
    role: options.role || 'MEMBER',
    branchId: options.branchId || 'branch-123',
    userId: options.userId || 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

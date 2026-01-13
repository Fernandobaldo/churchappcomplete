/**
 * Mock API - Web
 * 
 * Provides consistent API mocking for axios-based requests.
 * Can work with MSW (Mock Service Worker) if configured.
 * 
 * @example
 * ```typescript
 * import { mockApiResponse, mockApiError, resetApiMocks } from '../test/mockApi'
 * 
 * beforeEach(() => {
 *   resetApiMocks()
 * })
 * 
 * it('should handle API response', async () => {
 *   mockApiResponse('get', '/api/events', { data: mockEvents })
 *   // ... test
 * })
 * ```
 */

import { vi } from 'vitest'
import { apiMock } from './apiMock'

/**
 * Mock API response
 * 
 * @param method - HTTP method
 * @param url - URL pattern (optional, for matching)
 * @param response - Response data
 * @param options - Additional options
 */
// Armazenar mocks por método para acumular múltiplos mocks
const mockRegistry: Record<string, Map<string, { response: any; options?: any }>> = {
  get: new Map(),
  post: new Map(),
  put: new Map(),
  delete: new Map(),
}

// Função helper para criar implementação que consulta o registry
function createMockImplementation(method: 'get' | 'post' | 'put' | 'delete') {
  return (requestUrl: string, ...args: any[]) => {
    // Extrair apenas o path da URL (sem baseURL e query params)
    const urlPath = requestUrl.split('?')[0].replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '/')
    
    // Verificar todos os mocks registrados para este método
    for (const [mockUrl, mockConfig] of mockRegistry[method].entries()) {
      const mockPath = mockUrl.split('?')[0].replace(/^\/+/, '/')
      // Verificar match exato ou se a URL contém o path do mock
      if (urlPath === mockPath || urlPath.includes(mockPath) || requestUrl.includes(mockUrl)) {
        return Promise.resolve({
          data: mockConfig.response,
          status: mockConfig.options?.status || 200,
          statusText: 'OK',
          headers: mockConfig.options?.headers || {},
          config: {},
        })
      }
    }
    // If URL doesn't match, return original mock behavior
    return Promise.resolve({ data: null })
  }
}

export function mockApiResponse(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string | null,
  response: any,
  options?: {
    status?: number
    headers?: Record<string, string>
  }
) {
  const mockFn = apiMock[method] as any

  if (url) {
    // Registrar mock no registry
    mockRegistry[method].set(url, { response, options })
    
    // Reaplicar implementação que consulta o registry atualizado
    mockFn.mockImplementation(createMockImplementation(method))
  } else {
    // Mock all requests for this method
    mockFn.mockResolvedValue({
      data: response,
      status: options?.status || 200,
      statusText: 'OK',
      headers: options?.headers || {},
      config: {},
    })
  }
}

/**
 * Mock API error
 * 
 * @param method - HTTP method
 * @param url - URL pattern (optional)
 * @param error - Error response
 */
export function mockApiError(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string | null,
  error: {
    status?: number
    message?: string
    data?: any
  }
) {
  const mockFn = apiMock[method] as any

  if (url) {
    mockFn.mockImplementation((requestUrl: string) => {
      if (requestUrl === url || requestUrl.includes(url)) {
        const apiError: any = new Error(error.message || 'API Error')
        apiError.response = {
          status: error.status || 500,
          data: error.data || { message: error.message || 'Internal Server Error' },
        }
        return Promise.reject(apiError)
      }
      return Promise.resolve({ data: null })
    })
  } else {
    const apiError: any = new Error(error.message || 'API Error')
    apiError.response = {
      status: error.status || 500,
      data: error.data || { message: error.message || 'Internal Server Error' },
    }
    mockFn.mockRejectedValue(apiError)
  }
}

/**
 * Reset all API mocks
 */
export function resetApiMocks() {
  vi.clearAllMocks()
  ;(apiMock.get as any).mockReset()
  ;(apiMock.post as any).mockReset()
  ;(apiMock.put as any).mockReset()
  ;(apiMock.delete as any).mockReset()

  // Limpar registry de mocks
  mockRegistry.get.clear()
  mockRegistry.post.clear()
  mockRegistry.put.clear()
  mockRegistry.delete.clear()

  // Configurar mock padrão que consulta o registry (permite que mocks customizados sejam adicionados depois)
  ;(apiMock.get as any).mockImplementation(createMockImplementation('get'))
  ;(apiMock.post as any).mockImplementation(createMockImplementation('post'))
  ;(apiMock.put as any).mockImplementation(createMockImplementation('put'))
  ;(apiMock.delete as any).mockImplementation(createMockImplementation('delete'))
}

/**
 * Get API mock function for manual control
 */
export function getApiMock(method: 'get' | 'post' | 'put' | 'delete'): any {
  return apiMock[method]
}

export { apiMock }

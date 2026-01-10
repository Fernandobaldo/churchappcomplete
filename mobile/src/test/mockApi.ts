/**
 * Mock API - Mobile
 * 
 * Provides consistent API mocking for axios-based requests.
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

import api from '../api/api'

/**
 * Mock API response
 * 
 * @param method - HTTP method
 * @param url - URL pattern (optional, for matching)
 * @param response - Response data
 * @param options - Additional options
 */
export function mockApiResponse(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string | null,
  response: any,
  options?: {
    status?: number
    headers?: Record<string, string>
  }
) {
  const mockFn = api[method] as jest.Mock

  if (url) {
    // Mock with URL matching
    mockFn.mockImplementation((requestUrl: string, ...args: any[]) => {
      if (requestUrl === url || requestUrl.includes(url)) {
        return Promise.resolve({
          data: response,
          status: options?.status || 200,
          statusText: 'OK',
          headers: options?.headers || {},
          config: {},
        })
      }
      // If URL doesn't match, return original mock behavior
      return mockFn.originalImplementation?.(requestUrl, ...args) || Promise.resolve({ data: null })
    })
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
  const mockFn = api[method] as jest.Mock

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
      return mockFn.originalImplementation?.(requestUrl) || Promise.resolve({ data: null })
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
  ;(api.get as jest.Mock).mockReset()
  ;(api.post as jest.Mock).mockReset()
  ;(api.put as jest.Mock).mockReset()
  ;(api.delete as jest.Mock).mockReset()

  // Set default mock behavior (resolve with empty data)
  ;(api.get as jest.Mock).mockResolvedValue({ data: null })
  ;(api.post as jest.Mock).mockResolvedValue({ data: null })
  ;(api.put as jest.Mock).mockResolvedValue({ data: null })
  ;(api.delete as jest.Mock).mockResolvedValue({ data: null })
}

/**
 * Get API mock function for manual control
 */
export function getApiMock(method: 'get' | 'post' | 'put' | 'delete'): jest.Mock {
  return api[method] as jest.Mock
}


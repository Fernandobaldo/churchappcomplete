/**
 * Render with Providers - Mobile
 * 
 * Wraps component with all necessary providers for testing:
 * - NavigationContainer (React Navigation)
 * - AuthStore (Zustand)
 * - AsyncStorage mock
 * 
 * @example
 * ```typescript
 * import { renderWithProviders } from '../test/renderWithProviders'
 * 
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   authState: { token: 'mock-token', user: mockUser },
 *   navigationInitialState: { routes: [...] },
 * })
 * ```
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface RenderWithProvidersOptions extends RenderOptions {
  /**
   * Initial navigation state for NavigationContainer
   */
  navigationInitialState?: any

  /**
   * Mock auth state
   */
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

  /**
   * Mock AsyncStorage data
   */
  asyncStorageData?: Record<string, string>
}

/**
 * Render component with all necessary providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const {
    navigationInitialState,
    authState,
    asyncStorageData = {},
    ...renderOptions
  } = options

  // Configure AsyncStorage mock
  if (Object.keys(asyncStorageData).length > 0) {
    AsyncStorage.getItem = jest.fn((key: string) => {
      return Promise.resolve(asyncStorageData[key] || null)
    })
    AsyncStorage.setItem = jest.fn()
    AsyncStorage.multiRemove = jest.fn()
    AsyncStorage.removeItem = jest.fn()
    AsyncStorage.clear = jest.fn()
  }

  // Configure auth store
  if (authState) {
    useAuthStore.setState({
      token: authState.token ?? null,
      user: authState.user ?? null,
    })
  }

  // Wrapper with NavigationContainer
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <NavigationContainer initialState={navigationInitialState}>
        {children}
      </NavigationContainer>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}


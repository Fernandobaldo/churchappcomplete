/**
 * Render with Providers - Web
 * 
 * Wraps component with all necessary providers for testing:
 * - MemoryRouter (React Router)
 * - AuthStore (Zustand)
 * - Toaster (react-hot-toast)
 * 
 * @example
 * ```typescript
 * import { renderWithProviders } from '../test/renderWithProviders'
 * 
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   authState: { token: 'mock-token', user: mockUser },
 *   initialEntries: ['/dashboard'],
 * })
 * ```
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route entries for MemoryRouter
   */
  initialEntries?: string[]

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
}

/**
 * Render component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { initialEntries = ['/'], authState, ...renderOptions } = options

  // Configure auth store
  if (authState) {
    useAuthStore.setState({
      token: authState.token ?? null,
      user: authState.user ?? null,
    })
  }

  // Wrapper with Router and Toaster
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
        <Toaster />
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}


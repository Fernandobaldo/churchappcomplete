/**
 * Navigation Harness - Mobile
 * 
 * Helper utilities for testing navigation in React Navigation stack.
 * Provides helpers to test navigation flow, params, and guards.
 * 
 * @example
 * ```typescript
 * import { createNavigationHarness } from '../test/navigationHarness'
 * 
 * const { navigation, getCurrentRoute } = createNavigationHarness()
 * 
 * // In test
 * const route = getCurrentRoute()
 * expect(route.name).toBe('Dashboard')
 * ```
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { render, RenderAPI } from '@testing-library/react-native'
import type { NavigationContainerRef } from '@react-navigation/native'

const Stack = createNativeStackNavigator()

export interface NavigationHarnessOptions {
  /**
   * Initial route name
   */
  initialRouteName?: string

  /**
   * Screens to register in the stack
   */
  screens?: Record<string, React.ComponentType<any>>
}

/**
 * Create navigation harness for testing
 * 
 * Returns navigation container ref and helper functions
 */
export function createNavigationHarness(options: NavigationHarnessOptions = {}) {
  const navigationRef = React.createRef<NavigationContainerRef<any>>()
  const { initialRouteName = 'Test', screens = {} } = options

  const TestNavigator = () => {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRouteName}>
          {Object.entries(screens).map(([name, component]) => (
            <Stack.Screen
              key={name}
              name={name}
              component={component}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    )
  }

  const renderResult: RenderAPI = render(<TestNavigator />)

  const getCurrentRoute = () => {
    return navigationRef.current?.getCurrentRoute()
  }

  const navigate = (name: string, params?: any) => {
    navigationRef.current?.navigate(name as never, params as never)
  }

  const goBack = () => {
    navigationRef.current?.goBack()
  }

  const reset = (state: any) => {
    navigationRef.current?.reset(state)
  }

  return {
    navigationRef,
    renderResult,
    getCurrentRoute,
    navigate,
    goBack,
    reset,
  }
}

/**
 * Mock navigation object for components that use useNavigation hook
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  getId: jest.fn(() => 'test-id'),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
}

/**
 * Mock route object for components that use useRoute hook
 */
export const mockRoute = {
  key: 'test-route-key',
  name: 'TestScreen',
  params: {},
  path: undefined,
}


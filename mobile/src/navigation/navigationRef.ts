import { createNavigationContainerRef } from '@react-navigation/native'
import { removeToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'

export const navigationRef = createNavigationContainerRef()

export function resetToLogin() {
  removeToken()
  useAuthStore.getState().logout()
  
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    })
  }
}

export function resetToMain() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    })
  }
}

export function resetToOnboarding() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'StartOnboarding' as never }],
    })
  }
}


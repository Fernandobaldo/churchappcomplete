import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Limpa após cada teste
afterEach(() => {
  cleanup()
})

// Mock do localStorage com implementação real
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
global.localStorage = localStorageMock as any

// Mock do window.alert
global.window.alert = vi.fn()

// Mock do window.location
delete (window as any).location
window.location = { href: '' } as any

// Mock do toast
vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn()
  mockToast.success = vi.fn()
  mockToast.error = vi.fn()
  mockToast.loading = vi.fn()
  mockToast.info = vi.fn()
  return {
    default: mockToast,
    Toaster: () => null,
  }
})



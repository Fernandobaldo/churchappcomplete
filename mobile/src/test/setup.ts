import '@testing-library/jest-native/extend-expect'
import { cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Limpa após cada teste
afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock do expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3333',
    },
  },
}))

// Mock do React Native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((dict) => dict.ios),
}))

// Mock do Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}))

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}






import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Configura MSW antes de todos os testes
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Limpa handlers após cada teste
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Fecha o servidor após todos os testes
afterAll(() => server.close())


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '@/App'
import { useAuthStore } from '@/stores/authStore'
import { mockUser } from '@/test/mocks/mockData'

// Variável global para controlar a rota inicial nos testes
let testInitialEntries = ['/']

// Mock do BrowserRouter para usar MemoryRouter nos testes
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: any) => {
      const { MemoryRouter } = actual as any
      return <MemoryRouter initialEntries={testInitialEntries}>{children}</MemoryRouter>
    },
  }
})

// Mock do API para evitar chamadas reais
vi.mock('@/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}))

// Mock do Dashboard para evitar carregar tudo
vi.mock('@/pages/Dashboard', () => ({
  default: () => <div>Dashboard Page</div>,
}))

// Mock do Layout para simplificar - precisa renderizar Outlet
vi.mock('@/components/Layout', () => ({
  default: () => {
    const { Outlet } = require('react-router-dom')
    return (
      <div data-testid="layout">
        <Outlet />
      </div>
    )
  },
}))

describe('Protected Routes Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
    vi.clearAllMocks()
    testInitialEntries = ['/']
  })

  it('deve redirecionar para login quando não autenticado', async () => {
    testInitialEntries = ['/dashboard']
    render(<App />)

    // Deve mostrar página de login (verifica pelo título "Login")
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('deve permitir acesso quando autenticado', async () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: mockUser,
    })

    testInitialEntries = ['/dashboard']
    render(<App />)

    // Deve mostrar Dashboard quando autenticado
    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Não deve mostrar login
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument()
  })

  it('deve redirecionar para dashboard quando já logado e acessar /login', async () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: mockUser,
    })

    testInitialEntries = ['/login']
    render(<App />)

    // Deve redirecionar para dashboard (não deve mostrar login)
    await waitFor(() => {
      expect(screen.queryByText(/login/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})


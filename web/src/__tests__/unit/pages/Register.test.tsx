import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '@/pages/Register'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
const mockSetUserFromToken = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setUserFromToken: mockSetUserFromToken,
  })),
}))

describe('Register - Registro de Usuário', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      setUserFromToken: mockSetUserFromToken,
    })
  })

  it('deve renderizar o formulário de registro', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nome da igreja/i)).toBeInTheDocument()
  })

  it('deve permitir selecionar arquivo de avatar', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, file)

    // Verifica se o preview foi criado
    await waitFor(() => {
      const preview = document.querySelector('img[alt="Preview"]')
      expect(preview).toBeInTheDocument()
    })
  })

  it('deve fazer upload de avatar após criar conta', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    vi.mocked(api.post).mockImplementation((url: string) => {
      if (url === '/register') {
        return Promise.resolve({
          data: { token: 'test-token' },
        })
      }
      if (url === '/upload/avatar') {
        return Promise.resolve({
          data: { url: '/uploads/avatars/test.png' },
        })
      }
      if (url === '/churches') {
        return Promise.resolve({
          data: { church: { id: 'church-123' } },
        })
      }
      if (url === '/members/me') {
        return Promise.resolve({
          data: { id: 'member-123' },
        })
      }
      if (url.includes('/members/')) {
        return Promise.resolve({ data: {} })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/nome completo/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'password123')
    await user.type(screen.getByLabelText(/nome da igreja/i), 'Igreja Teste')

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, file)

    const submitButton = screen.getByRole('button', { name: /criar conta/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/upload/avatar', expect.any(FormData), expect.any(Object))
    })
  })

  it('deve validar tamanho máximo do arquivo de avatar', async () => {
    const user = userEvent.setup()
    // Criar arquivo maior que 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    const avatarInput = screen.getByLabelText(/foto de perfil/i)
    await user.upload(avatarInput, largeFile)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('A imagem deve ter no máximo 5MB')
    })
  })
})




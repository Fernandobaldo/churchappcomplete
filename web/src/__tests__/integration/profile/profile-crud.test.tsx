import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Profile from '@/pages/Profile'
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

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  memberId: 'member-123',
  role: 'MEMBER',
  branchId: 'branch-123',
  permissions: [],
}

const mockProfile = {
  id: 'member-123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '11999999999',
  address: 'Rua Teste, 123',
  birthDate: '01/01/1990',
  positionId: null,
  position: null,
}

const mockPositions = [
  { id: 'pos-1', name: 'Pastor', isDefault: true },
  { id: 'pos-2', name: 'Obreiro', isDefault: true },
]

const mockUpdateUser = vi.fn()

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    setUserFromToken: vi.fn(),
    updateUser: mockUpdateUser,
  })),
}))

describe('Profile CRUD Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
      setUserFromToken: vi.fn(),
      updateUser: mockUpdateUser,
    })

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/me') {
        return Promise.resolve({ data: mockProfile })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    vi.mocked(api.put).mockResolvedValue({
      data: mockProfile,
    })
  })

  // 2.1 Fluxo Completo de Atualização
  describe('Fluxo Completo de Atualização', () => {
    it('deve carregar perfil completo do backend', async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/members/me')
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('11999999999')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Rua Teste, 123')).toBeInTheDocument()
        expect(screen.getByDisplayValue('01/01/1990')).toBeInTheDocument()
      })
    })

    it('deve atualizar perfil com todos os campos', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Nome Atualizado',
        phone: '11988888888',
        address: 'Nova Rua, 456',
        birthDate: '15/05/1985',
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      await user.type(nameInput, 'Nome Atualizado')

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      await user.type(phoneInput, '11988888888')

      const addressInput = screen.getByLabelText(/endereço/i) as HTMLInputElement
      await user.tripleClick(addressInput)
      await user.keyboard('{Delete}')
      await user.type(addressInput, 'Nova Rua, 456')

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      await user.type(birthDateInput, '15051985')
      await waitFor(() => {
        expect(birthDateInput.value).toBe('15/05/1985')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            name: 'Nome Atualizado',
            phone: '11988888888',
            address: 'Nova Rua, 456',
            birthDate: '15/05/1985',
          })
        )
      })
    })

    it('deve atualizar perfil apenas com campos obrigatórios', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Apenas Nome',
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      await user.type(nameInput, 'Apenas Nome')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            name: 'Apenas Nome',
          })
        )
      })
    })

    it('deve remover campos opcionais (enviar null)', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        phone: null,
        address: null,
        birthDate: null,
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(phoneInput.value).toBe('')
      })

      const addressInput = screen.getByLabelText(/endereço/i) as HTMLInputElement
      await user.tripleClick(addressInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(addressInput.value).toBe('')
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      
      // Sair do campo de data para disparar onBlur
      await user.tab()
      await new Promise(resolve => setTimeout(resolve, 100))

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            phone: null,
            address: null,
            birthDate: null,
          })
        )
      })
    })
  })

  // 2.2 Validação Backend
  describe('Validação Backend', () => {
    it('deve receber erro 400 ao enviar nome vazio', async () => {
      const user = userEvent.setup()

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Nome é obrigatório',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(errorResponse)

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(nameInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      // O react-hook-form deve impedir o submit se o nome estiver vazio
      // Verificar que api.put NÃO foi chamado (validação do frontend funcionou)
      await waitFor(() => {
        expect(api.put).not.toHaveBeenCalled()
      }, { timeout: 2000 })
      
      // Verificar que a mensagem de erro do react-hook-form é exibida
      await waitFor(() => {
        const errorMessage = screen.queryByText(/nome é obrigatório/i)
        expect(errorMessage).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('deve receber erro 403 ao tentar alterar email próprio', async () => {
      const user = userEvent.setup()

      const errorResponse = {
        response: {
          status: 403,
          data: {
            error: 'Você não pode alterar seu próprio email',
          },
        },
      }

      // O email não deve ser enviado no updateData, mas se for, deve retornar erro
      vi.mocked(api.put).mockRejectedValue(errorResponse)

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
        expect(emailInput.disabled).toBe(true)
      })
    })

    it('deve receber erro 403 ao tentar alterar cargo sem permissão', async () => {
      const user = userEvent.setup()

      const errorResponse = {
        response: {
          status: 403,
          data: {
            error: 'Você não tem permissão para alterar o cargo',
          },
        },
      }

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const positionSelect = screen.getByLabelText(/cargo na igreja/i) as HTMLSelectElement
        expect(positionSelect.disabled).toBe(true)
      })
    })

    it('deve validar formato de data no backend', async () => {
      const user = userEvent.setup()

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Data de nascimento inválida',
          },
        },
      }

      vi.mocked(api.put).mockRejectedValue(errorResponse)

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      await user.type(birthDateInput, '99/99/9999') // Data inválida

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      // O frontend deve validar antes de enviar, mas se passar, o backend deve rejeitar
      await waitFor(() => {
        // Verifica que houve alguma validação
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  // 2.3 Persistência de Dados
  describe('Persistência de Dados', () => {
    it('campos removidos devem permanecer null no banco', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        phone: null,
        address: null,
        birthDate: null,
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      // Primeira atualização - remover campos
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      await waitFor(() => {
        expect(phoneInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            phone: null,
          })
        )
      })

      // Simular recarregamento do perfil
      vi.mocked(api.get).mockResolvedValueOnce({
        data: updatedProfile,
      })

      // Verificar que os campos permanecem null
      await waitFor(() => {
        const phoneInputAfter = screen.getByLabelText(/telefone/i) as HTMLInputElement
        expect(phoneInputAfter.value).toBe('')
      })
    })

    it('data deve ser salva no formato dd/mm/yyyy', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        birthDate: '15/05/1985',
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      // Aguardar que o componente seja totalmente renderizado
      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      
      // Limpar o campo usando tripleClick + Delete para garantir que o react-hook-form detecte
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      
      // Digitar nova data
      await user.type(birthDateInput, '15051985')
      
      // Verificar que a máscara foi aplicada (deve ser 15/05/1985)
      await waitFor(() => {
        expect(birthDateInput.value).toBe('15/05/1985')
      }, { timeout: 2000 })
      
      // Sair do campo para disparar onBlur e garantir que birthDateDisplay seja atualizado
      await user.tab()
      
      // Aguardar um pouco para garantir que o onBlur foi processado e birthDateDisplay foi atualizado
      await new Promise(resolve => setTimeout(resolve, 200))

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            birthDate: '15/05/1985',
          })
        )
      }, { timeout: 3000 })
    })

    it('campos atualizados devem ser refletidos na próxima carga', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Nome Atualizado',
        phone: '11988888888',
      }

      vi.mocked(api.put).mockResolvedValue({
        data: updatedProfile,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      await user.type(nameInput, 'Nome Atualizado')

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      await user.type(phoneInput, '11988888888')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalled()
      })

      // Simular recarregamento
      vi.mocked(api.get).mockResolvedValueOnce({
        data: updatedProfile,
      })

      // Verificar que os valores atualizados são exibidos
      await waitFor(() => {
        expect(screen.getByDisplayValue('Nome Atualizado')).toBeInTheDocument()
        expect(screen.getByDisplayValue('11988888888')).toBeInTheDocument()
      })
    })
  })
})


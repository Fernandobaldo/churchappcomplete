import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

const mockAdminUser = {
  ...mockUser,
  role: 'ADMINGERAL',
  permissions: [{ type: 'members_manage' }],
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

describe('Profile Update E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
      setUserFromToken: vi.fn(),
      updateUser: mockUpdateUser,
    })

    // Mock inicial do perfil
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/members/me') {
        return Promise.resolve({ data: mockProfile })
      }
      if (url === '/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })

    // Mock padrão do PUT (pode ser sobrescrito em testes específicos)
    vi.mocked(api.put).mockResolvedValue({
      data: mockProfile,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // 5.1 Fluxo Completo de Atualização de Perfil
  describe('Fluxo Completo de Atualização de Perfil', () => {
    it('usuário deve conseguir atualizar seu perfil', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Nome Atualizado',
        phone: '11988888888',
        address: 'Nova Rua, 456',
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

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            name: 'Nome Atualizado',
            phone: '11988888888',
            address: 'Nova Rua, 456',
          })
        )
      })

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'Nome Atualizado' })
      })
    })

    it('campos opcionais devem poder ser removidos', async () => {
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

      // Remover telefone
      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(phoneInput.value).toBe('')
      })

      // Remover endereço
      const addressInput = screen.getByLabelText(/endereço/i) as HTMLInputElement
      await user.tripleClick(addressInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(addressInput.value).toBe('')
      })

      // Remover data de nascimento
      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      
      // Sair do campo de data para disparar onBlur e garantir que birthDateDisplay seja atualizado
      await user.tab()
      
      // Aguardar um pouco para garantir que o onBlur foi processado
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

      // Verificar que os campos permanecem vazios
      await waitFor(() => {
        const phoneInputAfter = screen.getByLabelText(/telefone/i) as HTMLInputElement
        const addressInputAfter = screen.getByLabelText(/endereço/i) as HTMLInputElement
        const birthDateInputAfter = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement

        expect(phoneInputAfter.value).toBe('')
        expect(addressInputAfter.value).toBe('')
        expect(birthDateInputAfter.value).toBe('')
      })
    })

    it('data deve ser formatada corretamente', async () => {
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

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      
      // Limpar o campo primeiro
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      
      // Digitar nova data
      await user.type(birthDateInput, '15051985')

      // Verificar que a máscara foi aplicada
      await waitFor(() => {
        expect(birthDateInput.value).toBe('15/05/1985')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            birthDate: '15/05/1985',
          })
        )
      })

      // Aguardar que o toast de sucesso seja exibido (indica que a atualização foi concluída)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
      }, { timeout: 2000 })

      // O componente atualiza o campo usando os dados retornados do PUT (updatedProfile)
      // Aguardar que o campo seja atualizado com o novo valor
      await waitFor(() => {
        const updatedInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
        // O componente deve atualizar birthDateDisplay com o valor retornado do PUT
        expect(updatedInput.value).toBe('15/05/1985')
      }, { timeout: 3000 })
    })

    it('nome deve atualizar no header', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Nome Atualizado no Header',
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

      const nameInput = screen.getByLabelText(/nome/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Nome Atualizado no Header')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'Nome Atualizado no Header' })
      })
    })
  })

  // 5.2 Validações de Negócio
  describe('Validações de Negócio', () => {
    it('usuário não deve conseguir alterar próprio email', async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
        expect(emailInput.disabled).toBe(true)
        expect(emailInput.readOnly).toBe(true)
      })

      // Tentar alterar email não deve enviar requisição
      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        // Verificar que não foi enviado email no updateData
        if (api.put) {
          const calls = vi.mocked(api.put).mock.calls
          if (calls.length > 0) {
            const updateData = calls[0][1] as any
            expect(updateData).not.toHaveProperty('email')
          }
        }
      })
    })

    it('membro sem permissão não deve alterar cargo', async () => {
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

    it('admin não deve alterar próprio cargo no perfil (sempre desabilitado)', async () => {
      ;(useAuthStore as any).mockReturnValue({
        user: mockAdminUser,
        setUserFromToken: vi.fn(),
        updateUser: mockUpdateUser,
      })

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const positionSelect = screen.getByLabelText(/cargo na igreja/i) as HTMLSelectElement
        // No próprio perfil, o cargo está sempre desabilitado, mesmo para admins
        // Admins podem alterar cargo de outros membros em MemberDetails, não no próprio perfil
        expect(positionSelect.disabled).toBe(true)
      })
    })
  })
})


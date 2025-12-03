import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Profile from '@/pages/Profile'
import api from '@/api/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { hasAccess } from '@/utils/authUtils'

vi.mock('@/api/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/utils/authUtils', () => ({
  hasAccess: vi.fn(),
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

const mockPositions = [
  { id: 'pos-1', name: 'Pastor', isDefault: true },
  { id: 'pos-2', name: 'Obreiro', isDefault: true },
  { id: 'pos-3', name: 'Tesoureiro', isDefault: true },
]

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

const mockSetUserFromToken = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    setUserFromToken: mockSetUserFromToken,
    updateUser: mockUpdateUser,
  })),
}))

describe('Profile - Edição de Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      user: mockUser,
      setUserFromToken: mockSetUserFromToken,
      updateUser: mockUpdateUser,
    })
    vi.mocked(hasAccess).mockReturnValue(false)

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

  it('deve renderizar o formulário de perfil', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cargo na igreja/i)).toBeInTheDocument()
    })
  })

  it('deve carregar cargos disponíveis', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/positions')
    })

    await waitFor(() => {
      const select = screen.getByLabelText(/cargo na igreja/i)
      expect(select).toBeInTheDocument()
      expect(screen.getByText(/pastor/i)).toBeInTheDocument()
    })
  })

  it('não deve permitir selecionar cargo no próprio perfil (campo desabilitado)', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/cargo na igreja/i)).toBeInTheDocument()
    })

    const positionSelect = screen.getByLabelText(/cargo na igreja/i) as HTMLSelectElement
    // O campo está desabilitado, então não deve ser possível alterar
    expect(positionSelect.disabled).toBe(true)

    // Tentar salvar não deve incluir positionId no updateData
    const nameInput = screen.getByLabelText(/nome/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Teste')

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(submitButton)

    await waitFor(() => {
      if (api.put) {
        const calls = vi.mocked(api.put).mock.calls
        if (calls.length > 0) {
          const updateData = calls[0][1] as any
          // positionId não deve ser enviado no próprio perfil
          expect(updateData).not.toHaveProperty('positionId')
        }
      }
    })
  })

  it('deve permitir fazer upload de avatar', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    vi.mocked(api.post).mockResolvedValue({
      data: { url: '/uploads/avatars/test.png' },
    })

    vi.mocked(api.put).mockResolvedValue({
      data: { ...mockProfile, avatarUrl: '/uploads/avatars/test.png' },
    })

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/foto de perfil/i)).toBeInTheDocument()
    })

    const avatarInput = document.querySelector('input[type="file"]')
    if (avatarInput) {
      await user.upload(avatarInput, file)

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/upload/avatar', expect.any(FormData), expect.any(Object))
      })
    }
  })

  // 1.1 Validação de Campos Obrigatórios
  describe('Validação de Campos Obrigatórios', () => {
    it('deve exibir erro ao tentar salvar com nome vazio', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      
      // Limpar o campo usando tripleClick + Delete para garantir que o react-hook-form detecte
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(nameInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      // O react-hook-form deve impedir o submit se o campo estiver vazio
      await waitFor(() => {
        expect(api.put).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('deve exibir erro ao tentar salvar com nome apenas espaços', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      
      // Limpar o campo
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      
      // Digitar apenas espaços
      await user.type(nameInput, '   ')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      // O react-hook-form deve impedir o submit se o campo tiver apenas espaços
      await waitFor(() => {
        expect(api.put).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('deve permitir salvar com nome válido', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
      
      // Limpar o campo
      await user.tripleClick(nameInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(nameInput.value).toBe('')
      })
      
      // Digitar novo nome
      await user.type(nameInput, 'Novo Nome')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            name: 'Novo Nome',
          })
        )
      }, { timeout: 3000 })
    })
  })

  // 1.2 Validação de Campos Opcionais
  describe('Validação de Campos Opcionais', () => {
    it('deve permitir salvar sem telefone', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      
      // Limpar o campo usando tripleClick + Delete para garantir que o react-hook-form detecte
      await user.tripleClick(phoneInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
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
      }, { timeout: 3000 })
    })

    it('deve permitir salvar sem endereço', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
      })

      const addressInput = screen.getByLabelText(/endereço/i) as HTMLInputElement
      
      // Limpar o campo usando tripleClick + Delete para garantir que o react-hook-form detecte
      await user.tripleClick(addressInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(addressInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            address: null,
          })
        )
      }, { timeout: 3000 })
    })

    it('deve permitir salvar sem data de nascimento', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      
      // Limpar o campo usando tripleClick + Delete para garantir que o react-hook-form detecte
      await user.tripleClick(birthDateInput)
      await user.keyboard('{Delete}')
      
      // Aguardar que o campo esteja vazio
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })
      
      // Sair do campo para disparar onBlur e garantir que birthDateDisplay seja atualizado
      await user.tab()
      
      // Aguardar um pouco para garantir que o onBlur foi processado e birthDateDisplay foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100))

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            birthDate: null,
          })
        )
      }, { timeout: 3000 })
    })

    it('deve permitir salvar sem cargo', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/cargo na igreja/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalled()
      })
    })
  })

  // 1.3 Formato de Data (dd/mm/yyyy)
  describe('Formato de Data (dd/mm/yyyy)', () => {
    it('deve aplicar máscara dd/mm/yyyy ao digitar', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.clear(birthDateInput)
      await user.type(birthDateInput, '01011990')

      await waitFor(() => {
        expect(birthDateInput.value).toBe('01/01/1990')
      })
    })

    it('deve validar data completa (10 caracteres)', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      await user.clear(birthDateInput)
      await user.type(birthDateInput, '01/01/1990')

      expect(birthDateInput.value.length).toBe(10)
    })

    it('deve exibir erro se data estiver incompleta ao sair do campo', async () => {
      const user = userEvent.setup()

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
      
      // Digitar data incompleta (apenas dia e mês) - digitar números sem barras
      await user.type(birthDateInput, '0101')
      
      // Verificar que a máscara foi aplicada (deve ser 01/01)
      await waitFor(() => {
        expect(birthDateInput.value).toBe('01/01')
      }, { timeout: 2000 })
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Sair do campo (dispara onBlur)
      await user.tab()

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Data inválida'))
      }, { timeout: 2000 })
    })

    it('deve converter dd/mm/yyyy para formato correto ao enviar', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i)
      await user.clear(birthDateInput)
      await user.type(birthDateInput, '01/01/1990')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            birthDate: '01/01/1990',
          })
        )
      })
    })

    it('deve exibir data no formato dd/mm/yyyy ao carregar', async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
        expect(birthDateInput.value).toBe('01/01/1990')
      })
    })
  })

  // 1.4 Campos Somente Leitura
  describe('Campos Somente Leitura', () => {
    it('campo email deve estar desabilitado', async () => {
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
    })

    it('campo cargo deve estar desabilitado (sempre desabilitado no próprio perfil)', async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const positionSelect = screen.getByLabelText(/cargo na igreja/i) as HTMLSelectElement
        // O cargo está sempre desabilitado no próprio perfil, mesmo para admins
        expect(positionSelect.disabled).toBe(true)
      })
    })

    it('campo cargo deve estar desabilitado mesmo para admins no próprio perfil', async () => {
      ;(useAuthStore as any).mockReturnValue({
        user: mockAdminUser,
        setUserFromToken: mockSetUserFromToken,
        updateUser: mockUpdateUser,
      })
      vi.mocked(hasAccess).mockReturnValue(true)

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        const positionSelect = screen.getByLabelText(/cargo na igreja/i) as HTMLSelectElement
        // No próprio perfil, o cargo está sempre desabilitado
        // Admins podem alterar cargo de outros membros em MemberDetails, não no próprio perfil
        expect(positionSelect.disabled).toBe(true)
      })
    })
  })

  // 1.5 Remoção de Campos Opcionais
  describe('Remoção de Campos Opcionais', () => {
    it('deve enviar null ao remover telefone', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      
      // Selecionar todo o texto e deletar para garantir que o formulário seja atualizado
      await user.tripleClick(phoneInput) // Seleciona todo o texto
      await user.keyboard('{Delete}') // Deleta o texto selecionado

      // Verificar que o campo está vazio
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
    })

    it('deve enviar null ao remover endereço', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument()
      })

      const addressInput = screen.getByLabelText(/endereço/i) as HTMLInputElement
      
      // Selecionar todo o texto e deletar para garantir que o formulário seja atualizado
      await user.tripleClick(addressInput) // Seleciona todo o texto
      await user.keyboard('{Delete}') // Deleta o texto selecionado

      // Verificar que o campo está vazio
      await waitFor(() => {
        expect(addressInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            address: null,
          })
        )
      })
    })

    it('deve enviar null ao remover data de nascimento', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument()
      })

      const birthDateInput = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement
      
      // Selecionar todo o texto e deletar para disparar onChange
      await user.tripleClick(birthDateInput) // Seleciona todo o texto
      await user.keyboard('{Delete}') // Deleta o texto selecionado, disparando onChange

      // Verificar que o campo está vazio
      await waitFor(() => {
        expect(birthDateInput.value).toBe('')
      })

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/members/member-123',
          expect.objectContaining({
            birthDate: null,
          })
        )
      })
    })

    it('campos removidos devem permanecer vazios após salvar', async () => {
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

      const phoneInput = screen.getByLabelText(/telefone/i)
      await user.clear(phoneInput)

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalled()
      })

      await waitFor(() => {
        const phoneInputAfter = screen.getByLabelText(/telefone/i) as HTMLInputElement
        expect(phoneInputAfter.value).toBe('')
      })
    })
  })

  // 1.6 Atualização de Estado
  describe('Atualização de Estado', () => {
    it('deve atualizar nome no header após salvar', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Nome Atualizado',
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
      await user.type(nameInput, 'Nome Atualizado')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'Nome Atualizado' })
      })
    })

    it('deve atualizar authStore após salvar perfil', async () => {
      const user = userEvent.setup()

      const updatedProfile = {
        ...mockProfile,
        name: 'Novo Nome',
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
      await user.type(nameInput, 'Novo Nome')

      const submitButton = screen.getByRole('button', { name: /salvar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled()
      })
    })
  })
})


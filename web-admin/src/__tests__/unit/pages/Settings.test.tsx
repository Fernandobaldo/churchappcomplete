import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SystemSettings } from '../../../pages/Settings'
import { configApi } from '../../../api/adminApi'
import toast from 'react-hot-toast'

vi.mock('../../../api/adminApi')
vi.mock('react-hot-toast')

describe('SystemSettings - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(configApi.get as any).mockResolvedValue({
      trialDurationDays: 14,
      defaultNewUserPlan: 'free',
      defaultLanguage: 'pt-BR',
      emailTemplates: {
        welcome: 'Bem-vindo!',
        memberInvite: 'Convite',
        passwordReset: 'Reset',
      },
      paymentServiceConfig: {
        provider: 'stripe',
        apiKey: '',
      },
      emailServiceConfig: {
        provider: 'sendgrid',
        apiKey: '',
      },
    })
  })

  it('deve carregar configurações ao montar', async () => {
    render(<SystemSettings />)

    await waitFor(() => {
      expect(configApi.get).toHaveBeenCalled()
    })

    expect(await screen.findByDisplayValue('14')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('free')).toBeInTheDocument()
  })

  it('deve atualizar configurações quando salvar', async () => {
    const user = userEvent.setup()
    ;(configApi.update as any).mockResolvedValue({})

    render(<SystemSettings />)

    await waitFor(() => {
      expect(screen.getByText(/configurações do sistema/i)).toBeInTheDocument()
    })

    const trialInput = await screen.findByTestId('settings-trial-duration')
    await user.clear(trialInput)
    await user.type(trialInput, '30')

    const saveButton = screen.getByTestId('settings-save-button')
    await user.click(saveButton)

    await waitFor(() => {
      expect(configApi.update).toHaveBeenCalled()
    })

    expect(toast.success).toHaveBeenCalledWith('Configurações salvas com sucesso')
  })

  it('deve mostrar erro quando falhar ao salvar', async () => {
    const user = userEvent.setup()
    ;(configApi.update as any).mockRejectedValue(new Error('Erro ao salvar'))

    render(<SystemSettings />)

    await waitFor(() => {
      expect(screen.getByText(/configurações do sistema/i)).toBeInTheDocument()
    })

    const saveButton = screen.getByTestId('settings-save-button')
    await user.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar configurações')
    })
  })
})


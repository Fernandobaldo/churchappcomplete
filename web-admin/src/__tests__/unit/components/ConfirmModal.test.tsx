import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '../../../components/ConfirmModal'

describe('ConfirmModal - Unit Tests', () => {
  it('deve renderizar modal quando isOpen é true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirmar ação"
        message="Tem certeza que deseja continuar?"
      />
    )

    expect(screen.getByText('Confirmar ação')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza que deseja continuar?')).toBeInTheDocument()
  })

  it('não deve renderizar quando isOpen é false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirmar ação"
        message="Tem certeza que deseja continuar?"
      />
    )

    expect(screen.queryByText('Confirmar ação')).not.toBeInTheDocument()
  })

  it('deve chamar onConfirm quando botão de confirmar é clicado', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Confirmar ação"
        message="Tem certeza?"
      />
    )

    const confirmButton = screen.getByTestId('confirm-modal-confirm')
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onClose quando botão de cancelar é clicado', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Confirmar ação"
        message="Tem certeza?"
      />
    )

    const cancelButton = screen.getByTestId('confirm-modal-cancel')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deve usar textos customizados quando fornecidos', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Título Customizado"
        message="Mensagem customizada"
        confirmText="Sim, confirmar"
        cancelText="Não, cancelar"
      />
    )

    expect(screen.getByText('Sim, confirmar')).toBeInTheDocument()
    expect(screen.getByText('Não, cancelar')).toBeInTheDocument()
  })

  it('deve desabilitar botões quando loading é true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirmar"
        message="Mensagem"
        loading={true}
      />
    )

    const confirmButton = screen.getByText('Processando...')
    expect(confirmButton).toBeDisabled()
  })

  it('deve aplicar estilo danger quando variant é danger', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirmar"
        message="Mensagem"
        variant="danger"
      />
    )

    const confirmButton = screen.getByTestId('confirm-modal-confirm')
    expect(confirmButton).toHaveClass('bg-red-600')
  })
})


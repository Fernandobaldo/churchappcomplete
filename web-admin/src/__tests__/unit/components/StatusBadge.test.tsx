import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../../../components/StatusBadge'

describe('StatusBadge - Unit Tests', () => {
  it('deve renderizar badge com status active', () => {
    render(<StatusBadge status="active" variant="success" />)
    expect(screen.getByText(/ativo/i)).toBeInTheDocument()
  })

  it('deve renderizar badge com status blocked', () => {
    render(<StatusBadge status="blocked" variant="danger" />)
    expect(screen.getByText(/bloqueado/i)).toBeInTheDocument()
  })

  it('deve renderizar badge com status suspended', () => {
    render(<StatusBadge status="suspended" variant="danger" />)
    expect(screen.getByText(/suspenso/i)).toBeInTheDocument()
  })

  it('deve aplicar classes CSS corretas para variant success', () => {
    const { container } = render(<StatusBadge status="active" variant="success" />)
    const badge = container.querySelector('.bg-green-100')
    expect(badge).toBeInTheDocument()
  })

  it('deve aplicar classes CSS corretas para variant danger', () => {
    const { container } = render(<StatusBadge status="blocked" variant="danger" />)
    const badge = container.querySelector('.bg-red-100')
    expect(badge).toBeInTheDocument()
  })
})



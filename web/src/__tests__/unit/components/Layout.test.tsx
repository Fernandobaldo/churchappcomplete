import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '@/components/Layout'

describe('Layout', () => {
  it('deve renderizar Header e Sidebar', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    // Verifica se Header está presente (pelo texto ChurchPulse)
    expect(screen.getByText('ChurchPulse')).toBeInTheDocument()
    
    // Verifica se Sidebar está presente (pelo menu Dashboard)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('deve renderizar outlet para conteúdo das páginas', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    // Verifica se o main está presente
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })
})



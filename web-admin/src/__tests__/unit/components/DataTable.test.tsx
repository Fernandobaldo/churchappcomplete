import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '../../../components/DataTable'

interface TestItem {
  id: string
  name: string
  email: string
}

describe('DataTable - Unit Tests', () => {
  const mockData: TestItem[] = [
    { id: '1', name: 'Item 1', email: 'item1@test.com' },
    { id: '2', name: 'Item 2', email: 'item2@test.com' },
  ]

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof TestItem },
    { header: 'Email', accessor: 'email' as keyof TestItem },
  ]

  it('deve renderizar tabela com dados', () => {
    render(<DataTable data={mockData} columns={columns} loading={false} />)

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('item1@test.com')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('deve mostrar loading quando loading é true', () => {
    render(<DataTable data={[]} columns={columns} loading={true} />)

    expect(screen.getByTestId('data-table-loading')).toBeInTheDocument()
  })

  it('deve chamar onRowClick quando linha é clicada', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()

    render(
      <DataTable
        data={mockData}
        columns={columns}
        loading={false}
        onRowClick={onRowClick}
      />
    )

    const row = screen.getByText('Item 1').closest('tr')
    if (row) {
      await user.click(row)
      expect(onRowClick).toHaveBeenCalledWith(mockData[0])
    }
  })

  it('deve renderizar mensagem quando não há dados', () => {
    render(<DataTable data={[]} columns={columns} loading={false} />)

    expect(screen.getByTestId('data-table-empty')).toBeInTheDocument()
  })
})


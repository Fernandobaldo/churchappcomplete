import { useState, useEffect } from 'react'
import { DataTable } from '../../components/DataTable'
import { SearchInput } from '../../components/SearchInput'
import { membersApi } from '../../api/adminApi'
import { Member, PaginationParams } from '../../types'
import toast from 'react-hot-toast'

export function MembersList() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Resetar paginação para página 1 quando search mudar
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [search])

  useEffect(() => {
    loadMembers()
  }, [pagination.page, search])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await membersApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      })
      setMembers(response.members || [])
      setPagination({
        page: response.page || pagination.page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 50)),
      })
    } catch (error: any) {
      toast.error('Erro ao carregar membros')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      MEMBER: 'Membro',
      COORDINATOR: 'Coordenador',
      ADMINFILIAL: 'Admin Filial',
      ADMINGERAL: 'Admin Geral',
    }
    return labels[role] || role
  }

  const columns = [
    {
      header: 'Nome',
      accessor: 'name' as keyof Member,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Member,
    },
    {
      header: 'Igreja',
      accessor: (row: Member) => row.churchName || 'N/A',
    },
    {
      header: 'Filial',
      accessor: (row: Member) => row.branchName || 'N/A',
    },
    {
      header: 'Role',
      accessor: (row: Member) => getRoleLabel(row.role),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lista global de todos os membros do sistema
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome, email ou igreja..."
        className="max-w-md"
      />

      <DataTable
        data={members}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination({ ...pagination, page }),
        }}
      />
    </div>
  )
}

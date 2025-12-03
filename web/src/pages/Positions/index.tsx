import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

interface Position {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
  _count?: {
    Members: number
  }
}

interface PositionForm {
  name: string
}

export default function Positions() {
  const { user } = useAuthStore()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PositionForm>()

  const isAdmin = user?.role === 'ADMINGERAL'

  useEffect(() => {
    loadPositions()
  }, [])

  const loadPositions = async () => {
    try {
      const response = await api.get('/positions')
      setPositions(response.data)
    } catch (error: any) {
      toast.error('Erro ao carregar cargos')
    }
  }

  const onSubmit = async (data: PositionForm) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar cargos')
      return
    }

    setLoading(true)
    try {
      await api.post('/positions', data)
      toast.success('Cargo criado com sucesso!')
      reset()
      loadPositions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar cargo')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (id: string, newName: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar cargos')
      return
    }

    try {
      await api.put(`/positions/${id}`, { name: newName })
      toast.success('Cargo atualizado com sucesso!')
      setEditingId(null)
      loadPositions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar cargo')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem deletar cargos')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este cargo?')) {
      return
    }

    try {
      await api.delete(`/positions/${id}`)
      toast.success('Cargo deletado com sucesso!')
      loadPositions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar cargo')
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargos da Igreja</h1>
          <p className="text-gray-600 mt-1">Visualize os cargos disponíveis</p>
        </div>
        <div className="card">
          <p className="text-gray-600">Apenas administradores podem gerenciar cargos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cargos da Igreja</h1>
        <p className="text-gray-600 mt-1">Gerencie os cargos disponíveis para os membros</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Criar Novo Cargo
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cargo
            </label>
            <input
              {...register('name', { required: 'Nome do cargo é obrigatório' })}
              className="input"
              placeholder="Ex: Diácono, Músico, etc."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Criando...' : 'Criar Cargo'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Cargos Existentes</h2>
        <div className="space-y-2">
          {positions.length === 0 ? (
            <p className="text-gray-500">Nenhum cargo cadastrado ainda.</p>
          ) : (
            positions.map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{position.name}</span>
                    {position.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Padrão
                      </span>
                    )}
                  </div>
                  {position._count && (
                    <p className="text-sm text-gray-500 mt-1">
                      {position._count.Members} membro(s) com este cargo
                    </p>
                  )}
                </div>
                {!position.isDefault && (
                  <div className="flex items-center gap-2">
                    {editingId === position.id ? (
                      <input
                        type="text"
                        defaultValue={position.name}
                        onBlur={(e) => {
                          if (e.target.value !== position.name) {
                            handleEdit(position.id, e.target.value)
                          } else {
                            setEditingId(null)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur()
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className="input"
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(position.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(position.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


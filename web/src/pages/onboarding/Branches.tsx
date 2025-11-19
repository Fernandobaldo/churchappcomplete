import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/api'
import { Plus, X } from 'lucide-react'

interface Branch {
  id?: string
  name: string
  city: string
  country: string
  primaryColor: string
  address: string
}

export default function Branches() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([
    { name: 'Sede', city: '', country: 'BR', primaryColor: '#3B82F6', address: '' },
  ])
  const [churchId, setChurchId] = useState<string | null>(null)

  useEffect(() => {
    const loadChurch = async () => {
      try {
        const response = await api.get('/churches')
        const churches = response.data
        if (churches && churches.length > 0) {
          setChurchId(churches[0].id)
          
          // Carrega filiais existentes
          const branchesResponse = await api.get('/branches')
          const existingBranches = branchesResponse.data || []
          if (existingBranches.length > 0) {
            setBranches(
              existingBranches.map((b: any) => ({
                id: b.id,
                name: b.name,
                city: '',
                country: 'BR',
                primaryColor: '#3B82F6',
                address: '',
              }))
            )
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    loadChurch()
  }, [])

  const addBranch = () => {
    setBranches([
      ...branches,
      { name: '', city: '', country: 'BR', primaryColor: '#3B82F6', address: '' },
    ])
  }

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      setBranches(branches.filter((_, i) => i !== index))
    } else {
      toast.error('Você precisa ter pelo menos uma filial')
    }
  }

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    const updated = [...branches]
    updated[index] = { ...updated[index], [field]: value }
    setBranches(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!churchId) {
        toast.error('Igreja não encontrada. Volte e crie a igreja primeiro.')
        navigate('/onboarding/church')
        return
      }

      // Validação
      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i]
        if (!branch.name.trim()) {
          toast.error(`Nome da filial ${i + 1} é obrigatório`)
          setLoading(false)
          return
        }
      }

      // Cria/atualiza filiais
      for (const branch of branches) {
        if (branch.id) {
          // TODO: Atualizar filial existente quando houver endpoint PUT
          continue
        } else {
          // Cria nova filial
          try {
            await api.post('/branches', {
              name: branch.name,
              churchId: churchId,
            })
          } catch (error: any) {
            console.error('Erro ao criar filial:', error)
            // Continua mesmo com erro para não bloquear o fluxo
          }
        }
      }

      toast.success(`${branches.length} filial(is) salva(s) com sucesso!`)
      navigate('/onboarding/settings')
    } catch (error: any) {
      console.error('Erro ao salvar filiais:', error)
      toast.error('Não foi possível salvar todas as filiais. Você pode adicionar depois.')
      navigate('/onboarding/settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Filiais</h1>
            <p className="text-gray-600">
              Adicione as filiais da sua igreja. Você pode adicionar mais depois.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {branches.map((branch, index) => (
              <div
                key={index}
                className="p-6 border-2 border-gray-200 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filial {index + 1} {index === 0 && '(Principal)'}
                  </h3>
                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBranch(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor={`branch-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da filial *
                  </label>
                  <input
                    id={`branch-name-${index}`}
                    type="text"
                    value={branch.name}
                    onChange={(e) => updateBranch(index, 'name', e.target.value)}
                    className="input"
                    placeholder="Ex: Sede, Filial Centro, Campus Norte"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`branch-country-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <select
                      id={`branch-country-${index}`}
                      value={branch.country}
                      onChange={(e) => updateBranch(index, 'country', e.target.value)}
                      className="input"
                    >
                      <option value="BR">Brasil</option>
                      <option value="US">Estados Unidos</option>
                      <option value="PT">Portugal</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`branch-city-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                    </label>
                    <input
                      id={`branch-city-${index}`}
                      type="text"
                      value={branch.city}
                      onChange={(e) => updateBranch(index, 'city', e.target.value)}
                      className="input"
                      placeholder="São Paulo"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`branch-address-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    id={`branch-address-${index}`}
                    type="text"
                    value={branch.address}
                    onChange={(e) => updateBranch(index, 'address', e.target.value)}
                    className="input"
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addBranch}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar outra filial
            </button>

            <div className="pt-4 border-t border-gray-200 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/onboarding/church')}
                className="btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Salvando...' : 'Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


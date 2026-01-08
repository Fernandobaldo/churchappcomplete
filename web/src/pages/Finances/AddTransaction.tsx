import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import MemberSearch from '../../components/MemberSearch'

interface TransactionForm {
  amount: number
  type: 'ENTRY' | 'EXIT'
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO'
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS'
  exitTypeOther?: string
  contributionId?: string
  tithePayerMemberId?: string
  tithePayerName?: string
  isTithePayerMember?: boolean
  date?: string
}

interface Contribution {
  id: string
  title: string
  description?: string
}

export default function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionForm>({
    defaultValues: {
      type: 'ENTRY',
      entryType: undefined,
      isTithePayerMember: true,
    },
  })

  const type = watch('type')
  const entryType = watch('entryType')
  const exitType = watch('exitType')
  const isTithePayerMember = watch('isTithePayerMember')
  
  const [tithePayerMemberId, setTithePayerMemberId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [contributionMemberId, setContributionMemberId] = useState<string | null>(null)
  const [contributionMemberName, setContributionMemberName] = useState<string>('')
  const [isContributionMember, setIsContributionMember] = useState(true)

  useEffect(() => {
    if (entryType === 'CONTRIBUICAO') {
      fetchContributions()
    }
  }, [entryType])

  const fetchContributions = async () => {
    try {
      const response = await api.get('/contributions')
      setContributions(response.data)
    } catch (error) {
      console.error('Erro ao buscar contribuições:', error)
      toast.error('Erro ao carregar contribuições')
    }
  }

  const onSubmit = async (data: TransactionForm) => {
    try {
      const payload: any = {
        amount: parseFloat(data.amount.toString()),
        type: data.type,
      }

      // Adicionar date se fornecido
      if (data.date) {
        payload.date = data.date
      }

      // Limpar campos relacionados a dízimo se não for dízimo
      if (data.entryType !== 'DIZIMO') {
        payload.tithePayerMemberId = undefined
        payload.tithePayerName = undefined
        payload.isTithePayerMember = undefined
      } else {
        // Se for dízimo, incluir os campos apropriados
        if (data.isTithePayerMember) {
          payload.tithePayerMemberId = tithePayerMemberId || undefined
          payload.tithePayerName = undefined
          payload.isTithePayerMember = true
        } else {
          payload.tithePayerMemberId = undefined
          payload.isTithePayerMember = false
          // tithePayerName já está em data
        }
      }

      // Limpar exitType se não for EXIT
      if (data.type !== 'EXIT') {
        payload.exitType = undefined
        payload.exitTypeOther = undefined
      } else {
        payload.exitType = data.exitType
        // Se exitType é OUTROS, garantir que exitTypeOther está presente
        if (data.exitType === 'OUTROS' && !data.exitTypeOther) {
          toast.error('Descrição é obrigatória quando selecionar "Outros"')
          return
        }
        if (data.exitType === 'OUTROS') {
          payload.exitTypeOther = data.exitTypeOther
        }
      }

      // Limpar entryType se não for ENTRY
      if (data.type !== 'ENTRY') {
        payload.entryType = undefined
        payload.contributionId = undefined
      } else {
        payload.entryType = data.entryType
        if (data.entryType === 'CONTRIBUICAO') {
          payload.contributionId = data.contributionId
        }
      }

      await api.post('/finances', payload)
      toast.success('Transação adicionada com sucesso!')
      // Manter filtros na URL ao voltar
      const params = searchParams.toString()
      navigate(`/app/finances${params ? `?${params}` : ''}`)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao adicionar transação'
      toast.error(errorMessage)
      console.error('Erro ao adicionar transação:', error)
    }
  }

  return (
    <div className="space-y-6">
      <button
        id="back-button"
        onClick={() => {
          const params = searchParams.toString()
          navigate(`/app/finances${params ? `?${params}` : ''}`)
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Nova Transação</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              id="type"
              {...register('type', { required: 'Tipo é obrigatório' })}
              className="input"
              onChange={(e) => {
                register('type').onChange(e)
                // Limpar entryType quando mudar para EXIT
                if (e.target.value === 'EXIT') {
                  setValue('entryType', undefined)
                  setValue('isTithePayerMember', true)
                  setTithePayerMemberId(null)
                  setValue('tithePayerName', undefined)
                }
              }}
            >
              <option value="ENTRY">Entrada</option>
              <option value="EXIT">Saída</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {type === 'ENTRY' && (
            <div>
              <label htmlFor="entryType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Entrada *
              </label>
              <select
                id="entryType"
                {...register('entryType', { required: type === 'ENTRY' ? 'Tipo de entrada é obrigatório' : false })}
                className="input"
                onChange={(e) => {
                  register('entryType').onChange(e)
                  // Limpar campos de dizimista quando mudar para OFERTA ou CONTRIBUICAO
                  if (e.target.value === 'OFERTA' || e.target.value === 'CONTRIBUICAO') {
                    setTithePayerMemberId(null)
                    setValue('tithePayerName', undefined)
                    setValue('isTithePayerMember', true)
                    setValue('contributionId', undefined)
                  }
                  if (e.target.value === 'CONTRIBUICAO') {
                    setContributionMemberId(null)
                    setContributionMemberName('')
                    setIsContributionMember(true)
                  }
                }}
              >
                <option value="">Selecione...</option>
                <option value="OFERTA">Ofertas</option>
                <option value="DIZIMO">Dízimo</option>
                <option value="CONTRIBUICAO">Contribuição</option>
              </select>
              {errors.entryType && (
                <p className="mt-1 text-sm text-red-600">{errors.entryType.message}</p>
              )}
            </div>
          )}

          {type === 'ENTRY' && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                })}
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          )}

          {type === 'ENTRY' && (
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">Opcional - Se não informado, será usada a data atual</p>
            </div>
          )}

          {type === 'ENTRY' && entryType === 'CONTRIBUICAO' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="contributionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Contribuição *
                </label>
                <select
                  id="contributionId"
                  {...register('contributionId', {
                    required: entryType === 'CONTRIBUICAO' ? 'Contribuição é obrigatória' : false,
                  })}
                  className="input"
                >
                  <option value="">Selecione uma contribuição...</option>
                  {contributions.map((contribution) => (
                    <option key={contribution.id} value={contribution.id}>
                      {contribution.title}
                    </option>
                  ))}
                </select>
                {errors.contributionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.contributionId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="isContributionMember" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="isContributionMember"
                    type="checkbox"
                    checked={isContributionMember}
                    onChange={(e) => {
                      setIsContributionMember(e.target.checked)
                      if (!e.target.checked) {
                        setContributionMemberId(null)
                        setContributionMemberName('')
                      } else {
                        setContributionMemberName('')
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    O contribuinte é membro
                  </span>
                </label>
              </div>

              {isContributionMember ? (
                <div>
                  <label htmlFor="contributionMemberId" className="block text-sm font-medium text-gray-700 mb-1">
                    Contribuinte (Membro)
                  </label>
                  <MemberSearch
                    value={contributionMemberId || undefined}
                    onChange={(memberId) => {
                      setContributionMemberId(memberId)
                    }}
                    placeholder="Buscar membro contribuinte..."
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="contributionMemberName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Contribuinte
                  </label>
                  <input
                    id="contributionMemberName"
                    type="text"
                    value={contributionMemberName}
                    onChange={(e) => setContributionMemberName(e.target.value)}
                    className="input"
                    placeholder="Digite o nome do contribuinte"
                  />
                </div>
              )}
            </div>
          )}

          {type === 'ENTRY' && entryType === 'DIZIMO' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="isTithePayerMember" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="isTithePayerMember"
                    type="checkbox"
                    checked={isTithePayerMember ?? true}
                    onChange={(e) => {
                      setValue('isTithePayerMember', e.target.checked)
                      if (!e.target.checked) {
                        setTithePayerMemberId(null)
                        setValue('tithePayerName', '')
                      } else {
                        setValue('tithePayerName', undefined)
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    O dizimista é membro
                  </span>
                </label>
              </div>

              {isTithePayerMember ? (
                <div>
                  <label htmlFor="tithePayerMemberId" className="block text-sm font-medium text-gray-700 mb-1">
                    Dizimista (Membro) *
                  </label>
                  <div id="tithePayerMemberSearch">
                    <MemberSearch
                      value={tithePayerMemberId || undefined}
                      onChange={(memberId, memberName) => {
                        setTithePayerMemberId(memberId)
                        if (memberId) {
                          setValue('tithePayerMemberId', memberId, { shouldValidate: true })
                        } else {
                          setValue('tithePayerMemberId', undefined, { shouldValidate: true })
                        }
                      }}
                      placeholder="Buscar membro dizimista..."
                    />
                  </div>
                  {errors.tithePayerMemberId && (
                    <p className="mt-1 text-sm text-red-600">{errors.tithePayerMemberId.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="tithePayerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Dizimista *
                  </label>
                  <input
                    id="tithePayerName"
                    {...register('tithePayerName', {
                      required: entryType === 'DIZIMO' && !isTithePayerMember ? 'Nome do dizimista é obrigatório' : false,
                    })}
                    className="input"
                    placeholder="Digite o nome do dizimista"
                  />
                  {errors.tithePayerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.tithePayerName.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'EXIT' && (
            <div>
              <label htmlFor="exitType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Saída *
              </label>
              <select
                id="exitType"
                {...register('exitType', {
                  required: type === 'EXIT' ? 'Tipo de saída é obrigatório' : false,
                })}
                className="input"
                onChange={(e) => {
                  register('exitType').onChange(e)
                  if (e.target.value !== 'OUTROS') {
                    setValue('exitTypeOther', undefined)
                  }
                }}
              >
                <option value="">Selecione...</option>
                <option value="ALUGUEL">Aluguel</option>
                <option value="ENERGIA">Energia</option>
                <option value="AGUA">Água</option>
                <option value="INTERNET">Internet</option>
                <option value="OUTROS">Outros</option>
              </select>
              {errors.exitType && (
                <p className="mt-1 text-sm text-red-600">{errors.exitType.message}</p>
              )}
            </div>
          )}

          {type === 'EXIT' && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                })}
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          )}

          {type === 'EXIT' && (
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">Opcional - Se não informado, será usada a data atual</p>
            </div>
          )}

          {type === 'EXIT' && exitType === 'OUTROS' && (
            <div>
              <label htmlFor="exitTypeOther" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <input
                id="exitTypeOther"
                {...register('exitTypeOther', {
                  required: exitType === 'OUTROS' ? 'Descrição é obrigatória quando selecionar "Outros"' : false,
                })}
                className="input"
                placeholder="Digite a descrição do tipo de saída"
              />
              {errors.exitTypeOther && (
                <p className="mt-1 text-sm text-red-600">{errors.exitTypeOther.message}</p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button id="submit-button" type="submit" className="btn-primary">
              Salvar Transação
            </button>
            <button
              id="cancel-button"
              type="button"
              onClick={() => {
                const params = searchParams.toString()
                navigate(`/app/finances${params ? `?${params}` : ''}`)
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}




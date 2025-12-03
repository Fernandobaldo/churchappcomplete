import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Calendar, Plus, X, CreditCard } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { format } from 'date-fns'

interface PaymentMethod {
  id: string
  type: 'PIX' | 'CONTA_BR' | 'IBAN'
  data: Record<string, any>
}

interface ContributionForm {
  title: string
  description: string
  goal?: number
  endDate?: string
  isActive: boolean
  paymentMethods?: PaymentMethod[]
}

export default function AddContribution() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ContributionForm>({
    defaultValues: {
      isActive: true,
      paymentMethods: [],
    },
  })
  
  const [endDateDisplay, setEndDateDisplay] = useState<string>('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethodType, setPaymentMethodType] = useState<'PIX' | 'CONTA_BR' | 'IBAN'>('PIX')
  const [paymentData, setPaymentData] = useState<Record<string, string>>({})
  
  const paymentMethods = watch('paymentMethods') || []

  const formatDateToISO = (dateString: string): string => {
    if (!dateString) return ''
    const cleaned = dateString.replace(/\D/g, '')
    if (cleaned.length !== 8) return ''
    
    const day = cleaned.substring(0, 2)
    const month = cleaned.substring(2, 4)
    const year = cleaned.substring(4, 8)
    
    return `${year}-${month}-${day}`
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    let value = inputValue.replace(/\D/g, '')
    
    if (value === '' || inputValue === '') {
      setEndDateDisplay('')
      setValue('endDate', '', { shouldValidate: false })
      return
    }
    
    if (value.length > 8) {
      value = value.substring(0, 8)
    }
    
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2)
    }
    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5)
    }
    
    setEndDateDisplay(value)
    
    if (value.length === 10) {
      const isoDate = formatDateToISO(value)
      setValue('endDate', isoDate, { shouldValidate: true })
    } else {
      setValue('endDate', '', { shouldValidate: false })
    }
  }

  const addPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: paymentMethodType,
      data: { ...paymentData },
    }
    
    const current = paymentMethods || []
    setValue('paymentMethods', [...current, newMethod])
    setPaymentMethodType('PIX')
    setPaymentData({})
    setShowPaymentModal(false)
  }

  const removePaymentMethod = (id: string) => {
    const current = paymentMethods || []
    setValue('paymentMethods', current.filter(m => m.id !== id))
  }

  const onSubmit = async (data: ContributionForm) => {
    try {
      const submitData: any = {
        title: data.title,
        description: data.description,
        isActive: data.isActive,
      }

      if (data.goal) {
        submitData.goal = parseFloat(data.goal.toString())
      }

      if (data.endDate) {
        submitData.endDate = data.endDate
      }

      if (data.paymentMethods && data.paymentMethods.length > 0) {
        submitData.paymentMethods = data.paymentMethods.map(pm => ({
          type: pm.type,
          data: pm.data,
        }))
      }

      await api.post('/contributions', submitData)
      toast.success('Campanha de contribuição criada com sucesso!')
      navigate('/app/contributions')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar campanha')
    }
  }

  return (
    <div className="space-y-6">
      <button
        data-testid="back-button"
        onClick={() => navigate('/app/contributions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Nova Campanha de Contribuição</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              data-testid="title-input"
              {...register('title', { required: 'Título é obrigatório' })}
              className="input"
              placeholder="Ex: Campanha de Construção"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              data-testid="description-input"
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Descrição da campanha..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta de Arrecadação
              </label>
              <input
                data-testid="goal-input"
                type="number"
                step="0.01"
                {...register('goal', { 
                  min: 0,
                  valueAsNumber: true,
                })}
                className="input"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                Este é o valor objetivo da campanha. O usuário poderá contribuir com qualquer valor.
              </p>
              {errors.goal && (
                <p className="mt-1 text-sm text-red-600">{errors.goal.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Término
              </label>
              <input
                data-testid="endDate-input"
                type="text"
                value={endDateDisplay}
                onChange={handleEndDateChange}
                className="input"
                placeholder="dd/mm/yyyy"
                maxLength={10}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formas de Pagamento
            </label>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{pm.type}</span>
                    {pm.type === 'PIX' && pm.data.chave && (
                      <span className="text-sm text-gray-600">- {pm.data.chave}</span>
                    )}
                    {pm.type === 'CONTA_BR' && pm.data.banco && (
                      <span className="text-sm text-gray-600">- {pm.data.banco}</span>
                    )}
                    {pm.type === 'IBAN' && pm.data.iban && (
                      <span className="text-sm text-gray-600">- {pm.data.iban}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePaymentMethod(pm.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded hover:border-primary text-gray-600 hover:text-primary"
              >
                <Plus className="w-4 h-4" />
                Adicionar Forma de Pagamento
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Campanha Ativa
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              data-testid="cancel-button"
              type="button"
              onClick={() => navigate('/app/contributions')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button data-testid="submit-button" type="submit" className="btn-primary flex-1">
              Criar Campanha
            </button>
          </div>
        </form>
      </div>

      {/* Modal para adicionar forma de pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Adicionar Forma de Pagamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={paymentMethodType}
                  onChange={(e) => {
                    setPaymentMethodType(e.target.value as 'PIX' | 'CONTA_BR' | 'IBAN')
                    setPaymentData({})
                  }}
                  className="input"
                >
                  <option value="PIX">PIX</option>
                  <option value="CONTA_BR">Conta Bancária Brasileira</option>
                  <option value="IBAN">IBAN</option>
                </select>
              </div>

              {paymentMethodType === 'PIX' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave PIX *
                    </label>
                    <input
                      type="text"
                      value={paymentData.chave || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, chave: e.target.value })}
                      className="input"
                      placeholder="CPF, Email, Telefone ou Chave Aleatória"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do QR Code (opcional)
                    </label>
                    <input
                      type="text"
                      value={paymentData.qrCodeUrl || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, qrCodeUrl: e.target.value })}
                      className="input"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {paymentMethodType === 'CONTA_BR' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco *
                    </label>
                    <input
                      type="text"
                      value={paymentData.banco || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, banco: e.target.value })}
                      className="input"
                      placeholder="Nome do banco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agência *
                    </label>
                    <input
                      type="text"
                      value={paymentData.agencia || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, agencia: e.target.value })}
                      className="input"
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conta *
                    </label>
                    <input
                      type="text"
                      value={paymentData.conta || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, conta: e.target.value })}
                      className="input"
                      placeholder="00000-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Conta *
                    </label>
                    <select
                      value={paymentData.tipo || 'CORRENTE'}
                      onChange={(e) => setPaymentData({ ...paymentData, tipo: e.target.value })}
                      className="input"
                    >
                      <option value="CORRENTE">Corrente</option>
                      <option value="POUPANCA">Poupança</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethodType === 'IBAN' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN *
                    </label>
                    <input
                      type="text"
                      value={paymentData.iban || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, iban: e.target.value })}
                      className="input"
                      placeholder="GB82 WEST 1234 5698 7654 32"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={paymentData.banco || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, banco: e.target.value })}
                      className="input"
                      placeholder="Nome do banco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Titular
                    </label>
                    <input
                      type="text"
                      value={paymentData.nome || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, nome: e.target.value })}
                      className="input"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentData({})
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  className="btn-primary flex-1"
                  disabled={
                    (paymentMethodType === 'PIX' && !paymentData.chave) ||
                    (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                    (paymentMethodType === 'IBAN' && !paymentData.iban)
                  }
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

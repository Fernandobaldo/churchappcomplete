import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Church, Building2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'
import OnboardingHeader from '../../components/OnboardingHeader'

type StructureType = 'simple' | 'branches' | 'existing' | null

export default function Start() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedStructure, setSelectedStructure] = useState<StructureType>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingState = async () => {
      try {
        const response = await api.get('/onboarding/state')
        const state = response.data

        if (state.status === 'COMPLETE') {
          // Onboarding completo, não deveria chegar aqui (OnboardingRoute redireciona)
          // Mas se chegar, redireciona
          navigate('/app/dashboard')
          return
        } else if (state.status === 'PENDING') {
          // Onboarding pendente, preencher dados e continuar
          if (state.church) {
            // Salvar dados da igreja para prefill
            localStorage.setItem('onboarding_church_id', state.church.id)
            localStorage.setItem('onboarding_church_name', state.church.name || '')
            localStorage.setItem('onboarding_church_address', state.church.address || '')
          }
          
          if (state.branch) {
            // Se tem branch, pode ser estrutura com filiais
            localStorage.setItem('onboarding_structure', 'branches')
            setSelectedStructure('branches')
          } else {
            // Se não tem branch, pode ser estrutura simples
            localStorage.setItem('onboarding_structure', 'simple')
            setSelectedStructure('simple')
          }
        }
        // Se status é NEW, deixa o usuário escolher normalmente
      } catch (error: any) {
        console.error('Erro ao verificar estado de onboarding:', error)
        // Em caso de erro, continua normalmente
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingState()
  }, [navigate])

  const handleContinue = () => {
    if (!selectedStructure) {
      return
    }

    if (selectedStructure === 'simple' || selectedStructure === 'branches') {
      // Salva a escolha no localStorage para usar nas próximas etapas
      localStorage.setItem('onboarding_structure', selectedStructure)
      navigate('/onboarding/church')
    } else if (selectedStructure === 'existing') {
      // Por enquanto, apenas mostra mensagem
      toast.error('Funcionalidade de entrar em igreja existente será implementada em breve.')
      // TODO: Implementar fluxo de convite
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader />
      <div className="flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Escolha a estrutura da sua igreja
            </h1>
            <p className="text-lg text-gray-600">
              Selecione a opção que melhor descreve a estrutura da sua igreja
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Opção 1: Estrutura Simples */}
            <button
              onClick={() => setSelectedStructure('simple')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedStructure === 'simple'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                    selectedStructure === 'simple'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Church className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedStructure === 'simple'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedStructure === 'simple' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Criar uma igreja
              </h3>
              <p className="text-gray-600 text-sm">
                Estrutura simples, ideal para igrejas com uma única localização
              </p>
            </button>

            {/* Opção 2: Com Filiais */}
            <button
              onClick={() => setSelectedStructure('branches')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedStructure === 'branches'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                    selectedStructure === 'branches'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedStructure === 'branches'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedStructure === 'branches' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Criar igreja com filiais
              </h3>
              <p className="text-gray-600 text-sm">
                Ideal para igrejas com múltiplas localizações ou congregações
              </p>
            </button>

            {/* Opção 3: Entrar em Existente */}
            <button
              onClick={() => setSelectedStructure('existing')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedStructure === 'existing'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                    selectedStructure === 'existing'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Users className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedStructure === 'existing'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedStructure === 'existing' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Entrar em uma igreja existente
              </h3>
              <p className="text-gray-600 text-sm">
                Você recebeu um convite? Entre usando o código de convite
              </p>
            </button>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/onboarding/bem-vindo')}
              className="btn-secondary flex-1"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedStructure}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'
import OnboardingHeader from '../../components/OnboardingHeader'

export default function Concluido() {
  const { setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleGoToDashboard = async () => {
    setLoading(true)
    try {
      // Marcar onboarding como completo
      const response = await api.post('/onboarding/complete')
      
      // Se o backend retornar um token atualizado, atualizar o store
      if (response.data.token) {
        setUserFromToken(response.data.token)
        toast.success('Onboarding concluído!')
        // O OnboardingRoute irá redirecionar automaticamente quando detectar onboardingCompleted === true
      } else {
        // Se não retornar token, apenas mostra toast
        toast.success('Onboarding concluído!')
      }
    } catch (error: any) {
      console.error('Erro ao marcar onboarding como completo:', error)
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao concluir onboarding. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader />
      <div className="flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-20 h-20 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Configuração inicial concluída!
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Parabéns! Agora você já pode começar a gerenciar membros, eventos e contribuições da
              sua igreja.
            </p>
            <p className="text-gray-500">
              Você pode atualizar essas configurações a qualquer momento nas configurações do
              sistema.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGoToDashboard}
              disabled={loading}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finalizando...' : 'Ir para o painel'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}


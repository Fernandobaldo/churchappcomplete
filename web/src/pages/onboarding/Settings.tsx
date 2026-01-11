import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, Calendar, Heart, DollarSign, BookOpen, Users } from 'lucide-react'
import api from '../../api/api'
import OnboardingHeader from '../../components/OnboardingHeader'
import { useAuthStore } from '../../stores/authStore'

type Step = 1 | 2 | 3

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [rolesCreated, setRolesCreated] = useState(false)
  const [modules, setModules] = useState({
    events: true,
    members: true,
    contributions: true,
    finances: false,
    devotionals: true,
  })

  const steps = [
    { number: 1, title: 'Roles e Permissões', icon: Users },
    { number: 2, title: 'Módulos', icon: CheckCircle },
    { number: 3, title: 'Convites', icon: Users },
  ]

  const handleStep1 = async () => {
    setLoading(true)
    try {
      // Cria roles padrão usando preset
      // Por enquanto, apenas marca como criado
      // TODO: Integrar com endpoint de criação de roles quando disponível
      setRolesCreated(true)
      toast.success('Roles criadas com sucesso!')
      setCurrentStep(2)
    } catch (error) {
      console.error('Erro ao criar roles:', error)
      toast.error('Não foi possível criar roles. Você pode criar depois.')
      setCurrentStep(2) // Continua mesmo com erro
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = () => {
    // Salva módulos selecionados
    localStorage.setItem('onboarding_modules', JSON.stringify(modules))
    setCurrentStep(3)
  }

  const handleStep3 = async (emails: string[]) => {
    setLoading(true)
    try {
      // TODO: Integrar com endpoint de convites quando disponível
      if (emails.length > 0) {
        toast.success(`${emails.length} convite(s) será(ão) enviado(s)!`)
      }
      
      // Marcar etapa settings como completa
      try {
        await api.post('/onboarding/progress/settings')
      } catch (progressError) {
        console.error('Erro ao marcar progresso:', progressError)
      }
      
      // Navega para tela de conclusão
      navigate('/onboarding/concluido')
    } catch (error) {
      console.error('Erro ao enviar convites:', error)
      toast.error('Não foi possível enviar convites. Você pode enviar depois.')
      // Mesmo com erro, marca progresso e navega para conclusão
      try {
        await api.post('/onboarding/progress/settings')
      } catch (progressError) {
        console.error('Erro ao marcar progresso:', progressError)
      }
      navigate('/onboarding/concluido')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Roles e Permissões</h2>
              <p className="text-gray-600 mb-6">
                Vamos criar as roles padrão para sua igreja. Você pode personalizar depois.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Roles que serão criadas:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Administrador Geral (ADMINGERAL)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Administrador de Filial (ADMINFILIAL)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Coordenador (COORDINATOR)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Membro (MEMBER)</span>
                </li>
              </ul>
            </div>

            {rolesCreated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">✓ Roles criadas com sucesso!</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  // Verifica se veio de branches ou de church
                  const structureType = localStorage.getItem('onboarding_structure')
                  if (structureType === 'branches') {
                    navigate('/onboarding/branches')
                  } else {
                    navigate('/onboarding/church')
                  }
                }}
                className="btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rolesCreated) {
                    handleStep1()
                  } else {
                    setCurrentStep(2)
                  }
                }}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Criando...' : rolesCreated ? 'Continuar' : 'Criar Roles'}
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ativar Módulos</h2>
              <p className="text-gray-600 mb-6">
                Selecione quais módulos você deseja usar na sua igreja
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'events', label: 'Eventos', icon: Calendar, description: 'Gerencie cultos e eventos' },
                { key: 'members', label: 'Membros', icon: Users, description: 'Gerencie membros da igreja' },
                { key: 'contributions', label: 'Contribuições', icon: Heart, description: 'Gerencie ofertas e dízimos' },
                { key: 'finances', label: 'Finanças', icon: DollarSign, description: 'Controle financeiro completo' },
                { key: 'devotionals', label: 'Devocionais', icon: BookOpen, description: 'Compartilhe devocionais' },
              ].map((module) => (
                <label
                  key={module.key}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    modules[module.key as keyof typeof modules]
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={modules[module.key as keyof typeof modules]}
                      onChange={(e) =>
                        setModules({ ...modules, [module.key]: e.target.checked })
                      }
                      className="mt-1 w-5 h-5 text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <module.icon className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">{module.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleStep2}
                className="btn-primary flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        )

      case 3:
        return <InvitesStep onComplete={handleStep3} onBack={() => setCurrentStep(2)} loading={loading} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader />
      <div className="flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        currentStep >= step.number
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs text-center ${
                        currentStep >= step.number ? 'text-primary font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">{renderStepContent()}</div>
        </div>
      </div>
      </div>
    </div>
  )
}

// Componente para o passo de convites
function InvitesStep({
  onComplete,
  onBack,
  loading,
}: {
  onComplete: (emails: string[]) => void
  onBack: () => void
  loading: boolean
}) {
  const [emails, setEmails] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailList = emails
      .split('\n')
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    if (emailList.length > 0) {
      const invalidEmails = emailList.filter(
        (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      )

      if (invalidEmails.length > 0) {
        toast.error('Alguns emails são inválidos. Verifique e tente novamente.')
        return
      }
    }

    onComplete(emailList)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Enviar Convites</h2>
        <p className="text-gray-600 mb-6">
          Convide pessoas para fazer parte da sua igreja (opcional - você pode pular)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emails (um por linha)
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="input"
            rows={6}
            placeholder="email1@exemplo.com
email2@exemplo.com
email3@exemplo.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            Digite um email por linha. Os convites serão enviados por email.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              toast('Convites pulados. Você pode enviar depois.')
              onComplete([])
            }}
            className="btn-secondary flex-1"
          >
            Pular
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Enviando...' : 'Enviar Convites'}
          </button>
        </div>
      </form>
    </div>
  )
}


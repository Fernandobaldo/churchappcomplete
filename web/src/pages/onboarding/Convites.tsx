import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Convites() {
  const navigate = useNavigate()
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Integrar com endpoint de convites quando disponível
      // Por enquanto, apenas simula o sucesso
      
      const emailList = emails
        .split('\n')
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      if (emailList.length > 0) {
        // Validação básica de emails
        const invalidEmails = emailList.filter(
          (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )

        if (invalidEmails.length > 0) {
          toast.error('Alguns emails são inválidos. Verifique e tente novamente.')
          setLoading(false)
          return
        }

        // TODO: Chamar endpoint de convites
        // await api.post('/invites', { emails: emailList })
        
        toast.success(`${emailList.length} convite(s) enviado(s) com sucesso!`)
      }

      navigate('/onboarding/concluido')
    } catch (error: any) {
      console.error('Erro ao enviar convites:', error)
      toast.error('Não foi possível enviar os convites. Você pode fazer isso depois.')
      navigate('/onboarding/concluido')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/onboarding/concluido')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Convite de Membros</h1>
            <p className="text-gray-600">
              Você pode convidar sua equipe agora ou pular esta etapa e fazer isso depois.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
                Emails para convite (um por linha)
              </label>
              <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="input min-h-[150px] resize-none"
                placeholder="admin@igreja.com&#10;pastor@igreja.com&#10;secretario@igreja.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Opcional - Digite um email por linha. Você pode convidar membros depois também.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-4">
              <button
                type="button"
                onClick={handleSkip}
                className="btn-secondary flex-1"
              >
                Pular
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar convites e continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


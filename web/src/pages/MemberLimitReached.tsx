import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'

interface InviteLinkInfo {
  branchName: string
  churchName: string
}

export default function MemberLimitReached() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [linkInfo, setLinkInfo] = useState<InviteLinkInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchLinkInfo()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchLinkInfo = async () => {
    try {
      const response = await api.get(`/invite-links/${token}/info`)
      setLinkInfo(response.data)
    } catch (error) {
      console.error('Erro ao buscar informações do link:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Limite de Membros Atingido</h1>
          {linkInfo && (
            <p className="text-gray-700 mb-4">
              O limite de membros permitido para o plano da igreja{' '}
              <strong>{linkInfo.churchName}</strong> foi atingido.
            </p>
          )}
          <p className="text-gray-600 mb-6">
            Não é possível realizar novos registros no momento. Por favor, entre em contato com o
            administrador responsável para mais informações.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full"
          >
            Ir para Login
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  )
}




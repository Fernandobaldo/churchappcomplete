import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function Forbidden() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 p-6 rounded-full">
            <ShieldX className="w-16 h-16 text-red-600" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
            Entre em contato com o administrador se precisar de acesso.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/dashboard')}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}


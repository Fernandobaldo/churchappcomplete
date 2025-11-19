import { useNavigate } from 'react-router-dom'

export default function BemVindo() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Bem-vindo ao ChurchPulse!</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Estamos felizes em ter você aqui. Para começar a usar o sistema, vamos fazer alguns
              passos rápidos para configurar sua igreja.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate('/onboarding/start')}
              className="btn-primary px-8 py-3 text-lg"
            >
              Começar configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


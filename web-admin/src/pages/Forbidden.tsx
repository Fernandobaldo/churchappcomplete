import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Acesso Negado</h1>
        <p className="mt-2 text-sm text-gray-600">
          Você não tem permissão para acessar esta página.
        </p>
        <div className="mt-6">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-admin hover:bg-admin-dark"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, User, Heart } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import PermissionGuard from '../../components/PermissionGuard'

interface Devotional {
  id: string
  title: string
  content: string
  passage: string
  author: {
    id: string
    name: string
  }
  likes: number
  createdAt: string
}

export default function Devotionals() {
  const navigate = useNavigate()
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevotionals()
  }, [])

  const fetchDevotionals = async () => {
    try {
      const response = await api.get('/devotionals')
      setDevotionals(response.data)
    } catch (error) {
      toast.error('Erro ao carregar devocionais')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando devocionais...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devocionais</h1>
          <p className="text-gray-600 mt-1">Estudos bíblicos e devocionais</p>
        </div>
        <PermissionGuard permission="devotional_manage">
          <button onClick={() => navigate('/app/devotionals/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Devocional
          </button>
        </PermissionGuard>
      </div>

      {devotionals.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nenhum devocional cadastrado</p>
          <PermissionGuard permission="devotional_manage">
            <button onClick={() => navigate('/app/devotionals/new')} className="btn-primary">
              Criar Primeiro Devocional
            </button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devotionals.map((devotional) => (
            <div
              key={devotional.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/devotionals/${devotional.id}`)}
            >
              <h3 className="text-xl font-semibold mb-2">{devotional.title}</h3>
              <p className="text-sm text-gray-600 mb-3 font-medium">{devotional.passage}</p>
              <p className="text-gray-700 mb-4 line-clamp-3">{devotional.content}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{devotional.author.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{devotional.likes}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {format(new Date(devotional.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


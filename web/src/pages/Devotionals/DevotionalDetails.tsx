import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Heart, BookOpen } from 'lucide-react'
import api from '../../api/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { useAuthStore } from '../../stores/authStore'

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
  liked: boolean
}

export default function DevotionalDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [devotional, setDevotional] = useState<Devotional | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchDevotional()
    }
  }, [id])

  const fetchDevotional = async () => {
    try {
      const response = await api.get(`/devotionals/${id}`)
      setDevotional(response.data)
    } catch (error) {
      toast.error('Erro ao carregar devocional')
      navigate('/app/devotionals')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!devotional) return

    try {
      const response = await api.post(`/devotionals/${id}/like`)
      setDevotional({
        ...devotional,
        likes: response.data.likes,
        liked: response.data.liked,
      })
    } catch (error) {
      toast.error('Erro ao curtir devocional')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!devotional) {
    return null
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/app/devotionals')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4">{devotional.title}</h1>

        <div className="mb-6 p-4 bg-primary-light rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">Passagem Bíblica</span>
          </div>
          <p className="text-gray-800 font-medium">{devotional.passage}</p>
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {devotional.content}
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span>{devotional.author.name}</span>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(devotional.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          {user && (
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                devotional.liked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${devotional.liked ? 'fill-current' : ''}`} />
              <span>{devotional.likes}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


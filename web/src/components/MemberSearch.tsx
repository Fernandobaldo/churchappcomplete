import { useState, useEffect, useRef } from 'react'
import api from '../api/api'

interface Member {
  id: string
  name: string
  email?: string
  role?: string
}

interface MemberSearchProps {
  value?: string
  onChange: (memberId: string | null, memberName?: string) => void
  placeholder?: string
  className?: string
}

export default function MemberSearch({ value, onChange, placeholder = 'Buscar membro...', className = '' }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Buscar membros quando houver termo de busca
    if (searchTerm.trim().length >= 2) {
      setLoading(true)
      
      // Debounce da busca
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/members')
          const allMembers = response.data as Member[]
          
          // Filtrar membros localmente baseado no termo de busca
          const filtered = allMembers.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          
          setMembers(filtered.slice(0, 10)) // Limitar a 10 resultados
          setIsOpen(true)
        } catch (error) {
          console.error('Erro ao buscar membros:', error)
          setMembers([])
        } finally {
          setLoading(false)
        }
      }, 300)
    } else {
      setMembers([])
      setIsOpen(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    setSearchTerm(member.name)
    setIsOpen(false)
    onChange(member.id, member.name)
  }

  const handleClear = () => {
    setSelectedMember(null)
    setSearchTerm('')
    setIsOpen(false)
    onChange(null)
  }

  // Se houver value inicial, buscar o membro
  useEffect(() => {
    if (value && !selectedMember) {
      // Se value é um ID, buscar o membro
      api.get('/members')
        .then(response => {
          const member = response.data.find((m: Member) => m.id === value)
          if (member) {
            setSelectedMember(member)
            setSearchTerm(member.name)
          }
        })
        .catch(console.error)
    } else if (!value && selectedMember) {
      // Se value foi removido, limpar seleção
      setSelectedMember(null)
      setSearchTerm('')
    }
  }, [value, selectedMember])

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setSelectedMember(null)
            if (e.target.value === '') {
              onChange(null)
            }
          }}
          onFocus={() => {
            if (members.length > 0 || searchTerm.length >= 2) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="input w-full pr-10"
        />
        {selectedMember && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (members.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">Buscando...</div>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMember(member)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{member.name}</div>
                {member.email && (
                  <div className="text-sm text-gray-500">{member.email}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {isOpen && !loading && searchTerm.length >= 2 && members.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-center text-gray-500">
          Nenhum membro encontrado
        </div>
      )}
    </div>
  )
}


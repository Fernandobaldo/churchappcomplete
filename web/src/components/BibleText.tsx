import { useEffect, useState } from 'react'
import { bookTranslation } from '../utils/translateBooks'

function formatPassage(passage: string) {
  if (!passage) return ''

  const parts = passage.split(' ')
  let book: string
  let chapterAndVerse: string

  if (parts.length >= 3) {
    // Caso como "1 Coríntios 13:4"
    book = `${parts[0]} ${parts[1]}`
    chapterAndVerse = parts.slice(2).join(' ')
  } else if (parts.length === 2) {
    // Caso como "João 3:16"
    book = parts[0]
    chapterAndVerse = parts[1]
  } else {
    return ''
  }

  const translatedBook = bookTranslation[book.trim()]
  if (!translatedBook) {
    console.warn('Livro não encontrado:', book)
    return ''
  }

  return `${translatedBook}/${chapterAndVerse.replace(':', '/')}`
}

interface BibleTextProps {
  passage: string
  className?: string
}

export function BibleText({ passage, className = '' }: BibleTextProps) {
  const [bibleText, setBibleText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBibleText() {
      try {
        const formatted = formatPassage(passage)
        if (!formatted) {
          setBibleText('Passagem inválida.')
          setLoading(false)
          return
        }

        const response = await fetch(`https://www.abibliadigital.com.br/api/verses/nvi/${formatted}`, {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJNb24gQXByIDI4IDIwMjUgMTk6NTA6MzMgR01UKzAwMDAuZmVybmFuZG9iYWxkby53MUBnbWFpbC5jb20iLCJpYXQiOjE3NDU4Njk4MzN9.oVjX6k7iH_tCiihSjsC6m2DtC8b411xST1qzITJiIek',
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar passagem')
        }

        const data = await response.json()

        if (data.text) {
          setBibleText(data.text)
        } else if (data.verses) {
          setBibleText(data.verses.map((v: any) => v.text).join(' '))
        } else {
          setBibleText('Texto não encontrado.')
        }
        setError(null)
      } catch (error) {
        console.error('Erro buscando texto:', error)
        setError('Erro ao carregar passagem.')
        setBibleText('')
      } finally {
        setLoading(false)
      }
    }

    fetchBibleText()
  }, [passage])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        {error}
      </div>
    )
  }

  return (
    <div className={`text-sm leading-relaxed text-gray-700 font-medium ${className}`}>
      {bibleText || passage}
    </div>
  )
}



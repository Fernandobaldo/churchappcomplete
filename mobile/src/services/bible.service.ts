import { Platform } from 'react-native'
import Constants from 'expo-constants'

/**
 * Bible Service
 * 
 * Handles Bible API integration (A Biblia Digital).
 * Reads API token from environment variables or app config.
 */

// Get Bible API token from environment or config
const getBibleApiToken = (): string | null => {
  // 1. Check environment variable (highest priority)
  if (process.env.EXPO_PUBLIC_BIBLE_API_TOKEN) {
    return process.env.EXPO_PUBLIC_BIBLE_API_TOKEN
  }

  // 2. Check app.config.js extra config
  const configToken = Constants.expoConfig?.extra?.bibleApiToken
  if (configToken) {
    return configToken
  }

  // 3. No token found
  console.warn('Bible API token not found. Please set EXPO_PUBLIC_BIBLE_API_TOKEN or configure in app.config.js')
  return null
}

export interface BibleVerse {
  text: string
  verse?: number
}

export interface BiblePassageResponse {
  text?: string
  verses?: BibleVerse[]
}

/**
 * Format passage string for API (e.g., "João 3:16" -> "joao/3/16")
 * This function should match the formatPassage logic from BibleText component
 */
export function formatPassageForApi(passage: string, bookTranslation: Record<string, string>): string | null {
  if (!passage) return null

  const [first, second, third] = passage.split(' ')

  let book: string
  let chapterAndVerse: string

  if (third) {
    book = `${first} ${second}`
    chapterAndVerse = third
  } else {
    book = first
    chapterAndVerse = second
  }

  const translatedBook = bookTranslation[book.trim()]
  if (!translatedBook) {
    console.warn('Livro não encontrado:', book)
    return null
  }

  return `${translatedBook}/${chapterAndVerse.replace(':', '/')}`
}

export const bibleService = {
  /**
   * Get Bible passage text
   * @param passage Passage reference (e.g., "João 3:16")
   * @param bookTranslation Translation map for book names
   * @param version Bible version (default: 'nvi')
   * @returns Promise with passage text
   */
  getPassage: async (
    passage: string,
    bookTranslation: Record<string, string>,
    version: string = 'nvi'
  ): Promise<string> => {
    const token = getBibleApiToken()
    if (!token) {
      throw new Error('Bible API token not configured')
    }

    const formatted = formatPassageForApi(passage, bookTranslation)
    if (!formatted) {
      throw new Error('Passagem inválida')
    }

    const url = `https://www.abibliadigital.com.br/api/verses/${version}/${formatted}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Bible passage: ${response.statusText}`)
    }

    const data: BiblePassageResponse = await response.json()

    if (data.text) {
      return data.text
    } else if (data.verses && Array.isArray(data.verses)) {
      return data.verses.map(v => v.text).join(' ')
    } else {
      throw new Error('Texto não encontrado')
    }
  },
}


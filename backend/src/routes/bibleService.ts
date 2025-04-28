// services/bibleService.ts
export async function fetchVerseText(bookEn: string, chapter: number, verse: number, language: 'pt' | 'fr') {
    const translation = language === 'pt' ? 'almeida' : 'lsg'
    const url = `https://bible-api.com/${bookEn}+${chapter}:${verse}?translation=${translation}`

    try {
        const response = await fetch(url, { method: 'GET' })

        if (!response.ok) {
            throw new Error('Erro ao buscar texto da Bíblia')
        }

        const data = await response.json()

        if (!data || !data.text) {
            throw new Error('Texto da Bíblia não encontrado')
        }

        return data.text.trim()
    } catch (error) {
        console.error(`[BibleService] Erro ao buscar texto:`, error)
        throw error
    }
}

import { describe, it, expect } from 'vitest'
import { toEndOfDay, isDateOnly, normalizeExpirationDate } from '../../src/utils/dateUtils'

describe('dateUtils', () => {
  describe('toEndOfDay', () => {
    it('deve converter data para fim do dia (23:59:59.999)', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const endOfDay = toEndOfDay(date)

      expect(endOfDay.getHours()).toBe(23)
      expect(endOfDay.getMinutes()).toBe(59)
      expect(endOfDay.getSeconds()).toBe(59)
      expect(endOfDay.getMilliseconds()).toBe(999)
      expect(endOfDay.getDate()).toBe(date.getDate())
      expect(endOfDay.getMonth()).toBe(date.getMonth())
      expect(endOfDay.getFullYear()).toBe(date.getFullYear())
    })

    it('deve preservar o dia, mês e ano ao converter para fim do dia', () => {
      const date = new Date('2024-12-25T00:00:00.000Z')
      const endOfDay = toEndOfDay(date)

      expect(endOfDay.getFullYear()).toBe(2024)
      expect(endOfDay.getMonth()).toBe(11) // Dezembro é mês 11 (0-indexed)
      expect(endOfDay.getDate()).toBe(25)
    })
  })

  describe('isDateOnly', () => {
    it('deve identificar string no formato YYYY-MM-DD como date-only', () => {
      expect(isDateOnly('2024-01-15')).toBe(true)
      expect(isDateOnly('2024-12-25')).toBe(true)
    })

    it('deve identificar data com hora como não date-only', () => {
      expect(isDateOnly('2024-01-15T10:30:00.000Z')).toBe(false)
      expect(isDateOnly('2024-01-15T14:00:00.000Z')).toBe(false)
    })

    it('deve identificar data meia-noite UTC como date-only', () => {
      expect(isDateOnly('2024-01-15T00:00:00.000Z')).toBe(true)
      expect(isDateOnly('2024-01-15T00:00:00Z')).toBe(true)
    })
  })

  describe('normalizeExpirationDate', () => {
    it('deve converter date-only string para fim do dia', () => {
      const dateString = '2024-01-15'
      const normalized = normalizeExpirationDate(dateString)

      expect(normalized).not.toBeNull()
      if (normalized) {
        expect(normalized.getHours()).toBe(23)
        expect(normalized.getMinutes()).toBe(59)
        expect(normalized.getSeconds()).toBe(59)
        expect(normalized.getMilliseconds()).toBe(999)
      }
    })

    it('deve converter date-only Date (midnight) para fim do dia', () => {
      // Criar uma data local meia-noite (como seria criada no mobile)
      const date = new Date(2024, 0, 15, 0, 0, 0, 0) // 15 de janeiro de 2024, meia-noite local
      const normalized = normalizeExpirationDate(date)

      expect(normalized).not.toBeNull()
      if (normalized) {
        // Deve ser convertida para fim do dia (23:59:59.999) no mesmo dia
        expect(normalized.getHours()).toBe(23)
        expect(normalized.getMinutes()).toBe(59)
        expect(normalized.getSeconds()).toBe(59)
        expect(normalized.getMilliseconds()).toBe(999)
        expect(normalized.getDate()).toBe(15)
        expect(normalized.getMonth()).toBe(0) // Janeiro é 0
        expect(normalized.getFullYear()).toBe(2024)
      }
    })

    it('deve preservar data com hora quando já tem componente de tempo', () => {
      const dateString = '2024-01-15T14:30:00.000Z'
      const originalDate = new Date(dateString)
      const normalized = normalizeExpirationDate(dateString)

      expect(normalized).not.toBeNull()
      if (normalized) {
        // Deve preservar a hora original (ajustada para timezone local)
        expect(normalized.getTime()).toBe(originalDate.getTime())
      }
    })

    it('deve retornar null para null ou undefined', () => {
      expect(normalizeExpirationDate(null)).toBeNull()
      expect(normalizeExpirationDate(undefined)).toBeNull()
    })

    it('deve lançar erro para data inválida', () => {
      expect(() => normalizeExpirationDate('invalid-date')).toThrow('Invalid date provided')
    })

    it('deve tratar data de hoje como válida até fim do dia', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Meia-noite de hoje
      
      const normalized = normalizeExpirationDate(today)
      
      expect(normalized).not.toBeNull()
      if (normalized) {
        expect(normalized.getHours()).toBe(23)
        expect(normalized.getMinutes()).toBe(59)
        expect(normalized.getSeconds()).toBe(59)
        expect(normalized.getMilliseconds()).toBe(999)
        
        // Deve ser válido até o fim do dia de hoje
        const now = new Date()
        expect(now <= normalized).toBe(true) // Ainda é válido se não passou do fim do dia
      }
    })
  })
})


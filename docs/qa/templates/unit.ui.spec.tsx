/**
 * Template: Unit Test - UI (Mobile/Web)
 * 
 * Padrão Obrigatório: Mínimo de 5 testes por componente/screen crítico
 * 
 * Estrutura:
 * - AAA (Arrange-Act-Assert)
 * - Apenas mocks (NÃO usar API real, navegação real)
 * - Nomes claros: "deve [comportamento esperado]"
 * 
 * Localização:
 * - Mobile: mobile/src/__tests__/unit/[Component/Screen/Store][Name].test.{ts,tsx}
 * - Web: web/src/__tests__/unit/[Component/Page/Store][Name].test.{ts,tsx}
 * 
 * Exemplos:
 * - mobile/src/__tests__/unit/stores/authStoreWithOnboarding.test.ts
 * - web/src/__tests__/unit/pages/Login.test.tsx
 */

// Mobile: usar @jest/globals
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'

// Web: usar vitest
// import { describe, it, expect, beforeEach } from 'vitest'
// import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { renderWithProviders, mockAuthState, mockApiResponse, mockApiError, clearAllMocks } from '../../test/helpers'
import [ComponentName] from '../../[path]/[ComponentName]'

// Mock de dependências externas
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}))
// Mobile: mock AsyncStorage se necessário
// jest.mock('@react-native-async-storage/async-storage', () => ({
//   setItem: jest.fn(),
//   getItem: jest.fn(),
// }))

describe('[ComponentName] - Unit Tests', () => {
  beforeEach(() => {
    clearAllMocks()
    // Reset mocks específicos se necessário
  })

  // ============================================================================
  // TESTE 1: BASIC RENDER - Renderização básica
  // ============================================================================
  it('deve renderizar corretamente', () => {
    // Arrange - Setup do teste
    mockAuthState({
      token: 'mock-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      onboardingCompleted: true,
    })

    // Act - Renderização do componente
    const { getByText, getByTestId } = renderWithProviders(<ComponentName />)

    // Assert - Verificação de elementos renderizados
    expect(getByText('Expected Text')).toBeDefined()
    expect(getByTestId('component-container')).toBeDefined()
    // Verificar elementos essenciais
  })

  // ============================================================================
  // TESTE 2: LOADING STATE - Estado de carregamento
  // ============================================================================
  it('deve mostrar estado de carregamento durante [ação]', async () => {
    // Arrange
    mockApiResponse('get', '/api/[endpoint]', null, { loading: true })
    
    // Act
    const { getByTestId } = renderWithProviders(<ComponentName />)

    // Assert
    await waitFor(() => {
      expect(getByTestId('loading-spinner')).toBeDefined()
      // ou
      expect(screen.getByText('Carregando...')).toBeDefined()
    })
  })

  // ============================================================================
  // TESTE 3: ERROR STATE + RETRY - Estado de erro e retry
  // ============================================================================
  it('deve mostrar erro e permitir retry quando [ação] falha', async () => {
    // Arrange - Simular erro
    mockApiError('get', '/api/[endpoint]', {
      status: 500,
      message: 'Erro ao carregar dados',
    })

    // Act
    const { getByText, getByTestId } = renderWithProviders(<ComponentName />)

    // Assert - Verificar mensagem de erro
    await waitFor(() => {
      expect(getByText('Erro ao carregar dados')).toBeDefined()
      expect(getByTestId('retry-button')).toBeDefined()
    })

    // Act - Testar retry
    fireEvent.press(getByTestId('retry-button'))
    mockApiResponse('get', '/api/[endpoint]', { data: 'success' })

    // Assert - Verificar que retry funcionou
    await waitFor(() => {
      expect(getByText('Dados carregados')).toBeDefined()
    })
  })

  // ============================================================================
  // TESTE 4: EMPTY STATE - Estado vazio
  // ============================================================================
  it('deve renderizar estado vazio quando não há dados', async () => {
    // Arrange
    mockApiResponse('get', '/api/[endpoint]', { data: [] })
    mockAuthState({ /* estado autenticado */ })

    // Act
    const { getByText, queryByText } = renderWithProviders(<ComponentName />)

    // Assert - Verificar estado vazio
    await waitFor(() => {
      expect(getByText('Nenhum dado disponível')).toBeDefined()
      // Verificar que tabs/header permanecem visíveis quando aplicável
      expect(queryByText('Tab 1')).toBeDefined()
      expect(queryByText('Header')).toBeDefined()
    })
  })

  // ============================================================================
  // TESTE 5: PRIMARY INTERACTION - Interação principal
  // ============================================================================
  it('deve chamar [handler/action] ao [ação do usuário]', async () => {
    // Arrange
    const mockHandler = jest.fn()
    mockApiResponse('post', '/api/[endpoint]', { success: true })
    
    const { getByTestId } = renderWithProviders(
      <ComponentName onSubmit={mockHandler} />
    )

    // Act - Simular interação do usuário
    fireEvent.changeText(getByTestId('input-field'), 'Test Value')
    fireEvent.press(getByTestId('submit-button'))
    // ou para web:
    // fireEvent.click(getByTestId('submit-button'))

    // Assert - Verificar que handler foi chamado
    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'Test Value',
        })
      )
      // Verificar chamada de API se aplicável
      // expect(mockApiResponse).toHaveBeenCalledWith(...)
    })
  })

  // ============================================================================
  // TESTES ADICIONAIS (opcionais, mas recomendados)
  // ============================================================================

  // Exemplo: Validação de campos
  // it('deve validar campo obrigatório ao submeter', async () => {
  //   // Arrange
  //   const { getByTestId, getByText } = renderWithProviders(<ComponentName />)
  //
  //   // Act
  //   fireEvent.press(getByTestId('submit-button'))
  //
  //   // Assert
  //   await waitFor(() => {
  //     expect(getByText('Campo obrigatório')).toBeDefined()
  //   })
  // })

  // Exemplo: Navegação (quando aplicável)
  // it('deve navegar para [tela] ao clicar em [elemento]', () => {
  //   // Arrange
  //   const mockNavigate = jest.fn()
  //   jest.mock('@react-navigation/native', () => ({
  //     useNavigation: () => ({ navigate: mockNavigate }),
  //   }))
  //
  //   // Act
  //   const { getByTestId } = renderWithProviders(<ComponentName />)
  //   fireEvent.press(getByTestId('navigate-button'))
  //
  //   // Assert
  //   expect(mockNavigate).toHaveBeenCalledWith('[ScreenName]')
  // })
})

/**
 * CHECKLIST ANTES DE COMMITAR:
 * 
 * ✅ Estrutura:
 * [ ] Arquivo está em __tests__/unit/
 * [ ] Nome segue padrão: [Component/Screen/Store][Name].test.{ts,tsx}
 * [ ] Usa renderWithProviders e helpers corretos
 * 
 * ✅ Conteúdo:
 * [ ] Mínimo 5 testes implementados
 * [ ] Padrão AAA (Arrange-Act-Assert) em todos os testes
 * [ ] Usa apenas mocks (não API real, não navegação real)
 * [ ] Testes são determinísticos
 * 
 * ✅ Nomenclatura:
 * [ ] Nomes seguem padrão: "deve [comportamento esperado]"
 * 
 * ✅ Isolamento:
 * [ ] beforeEach limpa mocks corretamente
 * [ ] Testes podem ser executados independentemente
 * [ ] Não há dependência de ordem entre testes
 * 
 * ✅ Cobertura:
 * [ ] Renderização básica testada
 * [ ] Estados (loading, error, empty) testados
 * [ ] Interação principal testada
 */


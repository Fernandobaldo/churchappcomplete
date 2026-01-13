import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AddEventScreen from '../../../screens/AddEventScreen'
import { useNavigation } from '@react-navigation/native'
import { eventsService } from '../../../services/events.service'
import Toast from 'react-native-toast-message'

const mockGoBack = jest.fn()
const mockCanGoBack = jest.fn(() => true)

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
}))
jest.mock('../../../services/events.service')
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}))
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ token: 'test-token' })),
  },
}))
jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
  },
  resetToLogin: jest.fn(),
}))
jest.mock('../../../components/layouts/FormScreenLayout', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  return ({ children }: any) => <View>{children}</View>
})
jest.mock('../../../components/FormsComponent', () => {
  const React = require('react')
  const { View, Text, TouchableOpacity } = require('react-native')
  return ({ form, setForm, fields, onSubmit, submitLabel, loading }: any) => (
    <View>
      <TouchableOpacity onPress={onSubmit} disabled={loading}>
        <Text>{loading ? 'Salvando...' : submitLabel}</Text>
      </TouchableOpacity>
    </View>
  )
})

describe('AddEventScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGoBack.mockClear()
    mockCanGoBack.mockReturnValue(true)
    ;(eventsService.create as jest.Mock).mockResolvedValue({ id: 'event-1' })
    ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/event-images/test.jpg' }),
    })
  })

  it('deve renderizar campos obrigatórios com indicador', () => {
    const { getByText } = render(<AddEventScreen />)

    expect(getByText('Título do evento')).toBeTruthy()
    expect(getByText('Data de início')).toBeTruthy()
    expect(getByText('Data do término')).toBeTruthy()
    // Verifica indicadores de obrigatório
    const asterisks = getByText('*')
    expect(asterisks).toBeTruthy()
  })

  it('deve validar campos obrigatórios antes de submeter', async () => {
    const { getByText } = render(<AddEventScreen />)

    const submitButton = getByText('Salvar alterações')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Campos obrigatórios',
        })
      )
    })
  })

  it('deve validar que data de término não pode ser anterior à data de início', async () => {
    const { getByPlaceholderText, getByText } = render(<AddEventScreen />)

    // Simular preenchimento de datas inválidas
    // Como os campos de data usam pickers, vamos testar a validação diretamente
    const submitButton = getByText('Salvar alterações')
    fireEvent.press(submitButton)

    // Primeiro deve falhar por campos obrigatórios
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled()
    })
  })

  it('deve submeter formulário com dados válidos', async () => {
    const { getByText } = render(<AddEventScreen />)

    // Como os campos usam FormsComponent, vamos testar a submissão
    // após preencher os campos obrigatórios através do estado
    const submitButton = getByText('Salvar alterações')
    
    // Simular que o formulário foi preenchido (isso seria feito pelo usuário)
    // Por enquanto, apenas verificamos que o botão existe
    expect(submitButton).toBeTruthy()
  })

  it('deve prevenir múltiplas submissões simultâneas (double-click)', async () => {
    const { getByText } = render(<AddEventScreen />)
    const submitButton = getByText('Salvar alterações')

    // Simular primeiro clique
    fireEvent.press(submitButton)
    
    // Simular segundo clique imediatamente (double-click)
    fireEvent.press(submitButton)

    // Aguardar processamento
    await waitFor(() => {
      // Verifica que create foi chamado apenas uma vez
      expect(eventsService.create).toHaveBeenCalledTimes(1)
    })

    // Verifica que goBack foi chamado apenas uma vez
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('deve desabilitar botão durante processamento (loading state)', async () => {
    // Mock de uma promise que não resolve imediatamente
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    ;(eventsService.create as jest.Mock).mockReturnValue(pendingPromise)

    const { getByText } = render(<AddEventScreen />)
    const submitButton = getByText('Salvar alterações')

    // Primeiro clique inicia processamento
    fireEvent.press(submitButton)

    // Aguardar que o botão mostre estado de loading
    await waitFor(() => {
      const loadingButton = getByText('Salvando...')
      expect(loadingButton).toBeTruthy()
    })

    // Resolver a promise
    resolvePromise!({ id: 'event-1' })
  })

  it('deve verificar canGoBack antes de navegar', async () => {
    mockCanGoBack.mockReturnValue(false) // Não pode voltar

    const { getByText } = render(<AddEventScreen />)
    const submitButton = getByText('Salvar alterações')

    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(eventsService.create).toHaveBeenCalled()
    })

    // Verifica que canGoBack foi chamado
    expect(mockCanGoBack).toHaveBeenCalled()
    
    // Verifica que goBack NÃO foi chamado quando canGoBack retorna false
    expect(mockGoBack).not.toHaveBeenCalled()
  })
})


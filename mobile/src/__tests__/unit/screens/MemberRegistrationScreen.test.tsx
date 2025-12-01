import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import MemberRegistrationScreen from '../../../screens/MemberRegistrationScreen'
import { useAuthStore } from '../../../stores/authStore'
import { useRoute } from '@react-navigation/native'
import api from '../../../api/api'
import Toast from 'react-native-toast-message'

jest.mock('../../../stores/authStore')
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
  useRoute: jest.fn(),
}))
jest.mock('../../../api/api')
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}))

describe('MemberRegistrationScreen', () => {
  const mockUser = {
    id: 'user-123',
    branchId: 'branch-123',
  }

  const mockRoute = {
    params: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as jest.Mock).mockReturnValue({ user: mockUser })
    ;(useRoute as jest.Mock).mockReturnValue(mockRoute)
    ;(api.get as jest.Mock).mockResolvedValue({
      data: [
        { value: 'MEMBER', label: 'Membro' },
        { value: 'COORDINATOR', label: 'Coordenador' },
      ],
    })
    ;(api.post as jest.Mock).mockResolvedValue({ data: { success: true } })
  })

  it('deve renderizar campos obrigatórios com indicador', async () => {
    const { getByText } = render(<MemberRegistrationScreen />)

    await waitFor(() => {
      expect(getByText('Nome completo')).toBeTruthy()
      expect(getByText('E-mail')).toBeTruthy()
      expect(getByText('Senha')).toBeTruthy()
      // Verifica indicadores de obrigatório
      const asterisks = getByText('*')
      expect(asterisks).toBeTruthy()
    })
  })

  it('deve validar campos obrigatórios antes de submeter', async () => {
    const { getByText } = render(<MemberRegistrationScreen />)

    await waitFor(() => {
      const submitButton = getByText('Cadastrar membro')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Campos obrigatórios',
        })
      )
    })
  })

  it('deve validar senha com mínimo de 6 caracteres', async () => {
    const { getByPlaceholderText, getByText } = render(<MemberRegistrationScreen />)

    await waitFor(() => {
      const nameInput = getByPlaceholderText('Seu nome completo')
      const emailInput = getByPlaceholderText('exemplo@email.com')
      const passwordInput = getByPlaceholderText('Mínimo 6 caracteres')

      fireEvent.changeText(nameInput, 'Test User')
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, '12345') // Menos de 6 caracteres

      const submitButton = getByText('Cadastrar membro')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Senha inválida',
        })
      )
    })
  })

  it('deve submeter formulário com dados válidos', async () => {
    const { getByPlaceholderText, getByText } = render(<MemberRegistrationScreen />)

    await waitFor(() => {
      const nameInput = getByPlaceholderText('Seu nome completo')
      const emailInput = getByPlaceholderText('exemplo@email.com')
      const passwordInput = getByPlaceholderText('Mínimo 6 caracteres')

      fireEvent.changeText(nameInput, 'Test User')
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      const submitButton = getByText('Cadastrar membro')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/register',
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          branchId: 'branch-123',
        })
      )
    })
  })
})


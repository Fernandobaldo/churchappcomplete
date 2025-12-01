import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import FormsComponent from '../../../components/FormsComponent'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'

jest.mock('@react-navigation/native')
jest.mock('expo-image-picker')
jest.mock('react-native-modal-datetime-picker', () => ({
  __esModule: true,
  default: ({ isVisible, onConfirm, onCancel }: any) => {
    if (isVisible) {
      setTimeout(() => {
        onConfirm(new Date('2024-01-15'))
      }, 0)
    }
    return null
  },
}))

describe('FormsComponent', () => {
  const mockNavigation = {
    goBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNavigation as jest.Mock).mockReturnValue(mockNavigation)
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    })
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }],
    })
  })

  it('deve renderizar campos de texto', () => {
    const form = { name: '' }
    const setForm = jest.fn()
    const fields = [
      { key: 'name', label: 'Nome', type: 'string', required: true },
    ]

    const { getByPlaceholderText, getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByText('Nome')).toBeTruthy()
    expect(getByText('*')).toBeTruthy() // Indicador de obrigatório
  })

  it('deve renderizar campo obrigatório com indicador', () => {
    const form = { email: '' }
    const setForm = jest.fn()
    const fields = [
      { key: 'email', label: 'E-mail', type: 'email', required: true },
    ]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    const label = getByText('E-mail')
    expect(label).toBeTruthy()
    // Verifica se o asterisco está presente
    expect(getByText('*')).toBeTruthy()
  })

  it('deve renderizar campo de data', async () => {
    const form = { birthDate: '' }
    const setForm = jest.fn()
    const fields = [
      { key: 'birthDate', label: 'Data de nascimento', type: 'date', required: true },
    ]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByText('Data de nascimento')).toBeTruthy()
    
    // Simular clique no campo de data
    const dateField = getByText('DD/MM/AAAA')
    fireEvent.press(dateField)

    await waitFor(() => {
      expect(setForm).toHaveBeenCalled()
    })
  })

  it('deve renderizar campo select', () => {
    const form = { role: '' }
    const setForm = jest.fn()
    const fields = [
      {
        key: 'role',
        label: 'Tipo',
        type: 'select',
        options: [
          { key: '1', label: 'Membro', value: 'MEMBER' },
          { key: '2', label: 'Admin', value: 'ADMIN' },
        ],
      },
    ]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByText('Tipo')).toBeTruthy()
  })

  it('deve renderizar campo toggle', () => {
    const form = { hasDonation: false }
    const setForm = jest.fn()
    const fields = [
      { key: 'hasDonation', label: 'Habilitar doação', type: 'toggle' },
    ]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByText('Habilitar doação')).toBeTruthy()
  })

  it('deve chamar onSubmit ao pressionar botão salvar', () => {
    const form = { name: 'Test' }
    const setForm = jest.fn()
    const onSubmit = jest.fn()
    const fields = [{ key: 'name', label: 'Nome', type: 'string' }]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={onSubmit}
      />
    )

    const saveButton = getByText('Salvar')
    fireEvent.press(saveButton)

    expect(onSubmit).toHaveBeenCalled()
  })

  it('deve usar placeholder padrão para email', () => {
    const form = { email: '' }
    const setForm = jest.fn()
    const fields = [
      { key: 'email', label: 'E-mail', type: 'email' },
    ]

    const { getByPlaceholderText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByPlaceholderText('exemplo@email.com')).toBeTruthy()
  })

  it('deve renderizar campo dependente apenas quando campo pai está ativo', () => {
    const form = { hasDonation: false, donationReason: '' }
    const setForm = jest.fn()
    const fields = [
      { key: 'hasDonation', label: 'Habilitar doação', type: 'toggle' },
      {
        key: 'donationReason',
        label: 'Motivo',
        type: 'string',
        dependsOn: 'hasDonation',
      },
    ]

    const { queryByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    // Campo dependente não deve aparecer quando hasDonation é false
    expect(queryByText('Motivo')).toBeNull()
  })

  it('deve exibir mensagem de erro quando campo tem erro', () => {
    const form = { email: '' }
    const setForm = jest.fn()
    const fields = [
      {
        key: 'email',
        label: 'E-mail',
        type: 'email',
        required: true,
        error: 'E-mail inválido',
      },
    ]

    const { getByText } = render(
      <FormsComponent
        form={form}
        setForm={setForm}
        fields={fields}
        onSubmit={jest.fn()}
      />
    )

    expect(getByText('E-mail inválido')).toBeTruthy()
  })
})


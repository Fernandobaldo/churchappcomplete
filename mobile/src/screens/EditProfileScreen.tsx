import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Picker } from '@react-native-picker/picker'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import PageHeader from '../components/PageHeader'

interface Position {
  id: string
  name: string
  isDefault: boolean
}

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const { user, setUserFromToken, updateUser } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Estados do formulário
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [birthDateDisplay, setBirthDateDisplay] = useState('')
  const [positionId, setPositionId] = useState<string>('')
  
  // Estados do avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Validações
  const [nameError, setNameError] = useState('')
  const [birthDateError, setBirthDateError] = useState('')

  // Função para formatar data para dd/mm/yyyy
  const formatDateToDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    // Se já está no formato dd/mm/yyyy, retorna
    if (dateString.includes('/')) {
      return dateString
    }
    // Se está no formato yyyy-MM-dd, converte
    try {
      const parts = dateString.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    } catch (e) {
      // Se falhar, retorna como está
    }
    return dateString
  }

  // Função para aplicar máscara dd/mm/yyyy enquanto digita
  const handleBirthDateChange = (text: string) => {
    let value = text.replace(/\D/g, '') // Remove tudo que não é dígito

    if (value === '' || text === '') {
      setBirthDateDisplay('')
      setBirthDateError('')
      return
    }

    if (value.length > 8) {
      value = value.substring(0, 8)
    }

    // Aplica máscara dd/mm/yyyy
    let formatted = value
    if (value.length > 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2)
    }
    if (value.length > 4) {
      formatted = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4)
    }

    setBirthDateDisplay(formatted)

    // Validação
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/')
      const dayNum = parseInt(day, 10)
      const monthNum = parseInt(month, 10)
      const yearNum = parseInt(year, 10)

      if (
        dayNum < 1 || dayNum > 31 ||
        monthNum < 1 || monthNum > 12 ||
        yearNum < 1900 || yearNum > 2100
      ) {
        setBirthDateError('Data inválida')
      } else {
        setBirthDateError('')
      }
    } else if (formatted.length > 0) {
      setBirthDateError('')
    }
  }

  // Carregar posições
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const positionsResponse = await api.get('/positions')
        setPositions(Array.isArray(positionsResponse.data) ? positionsResponse.data : [])
        setIsInitialLoad(false)
      } catch (error) {
        console.error('Erro ao carregar cargos:', error)
        setIsInitialLoad(false)
      }
    }

    if (isInitialLoad) {
      loadPositions()
    }
  }, [isInitialLoad])

  // Carregar perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.memberId || isInitialLoad) return

      try {
        const profileResponse = await api.get('/members/me')
        const profile = profileResponse.data

        // Preparar dados do formulário
        const birthDateDisplayValue = profile.birthDate ? formatDateToDisplay(profile.birthDate) : ''
        setBirthDateDisplay(birthDateDisplayValue)

        setName(profile.name || user.name || '')
        setEmail(profile.email || user.email || '')
        setPhone(profile.phone ?? '')
        setAddress(profile.address ?? '')
        
        const posId = profile.positionId ?? profile.position?.id ?? null
        setPositionId(posId ? String(posId) : '')

        if (profile.avatarUrl) {
          setCurrentAvatarUrl(profile.avatarUrl)
        } else {
          setCurrentAvatarUrl(null)
        }

        setProfile(profile)
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        Toast.show({ type: 'error', text1: 'Erro ao carregar dados do perfil' })
      } finally {
        setLoading(false)
      }
    }

    if (!isInitialLoad) {
      loadProfile()
    }
  }, [user?.memberId, isInitialLoad])

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permissão para acessar galeria negada' })
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Validar tamanho (5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Toast.show({ type: 'error', text1: 'A imagem deve ter no máximo 5MB' })
          return
        }

        setAvatarUri(asset.uri)
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error)
      Toast.show({ type: 'error', text1: 'Erro ao selecionar imagem' })
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUri(null)
    setCurrentAvatarUrl(null)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarUri) return null

    try {
      setUploadingAvatar(true)

      const formData = new FormData()
      const filename = avatarUri.split('/').pop() || 'avatar.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : `image/jpeg`

      formData.append('file', {
        uri: avatarUri,
        name: filename,
        type,
      } as any)

      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error)
      Toast.show({ type: 'error', text1: error.response?.data?.error || 'Erro ao fazer upload do avatar' })
      throw error
    } finally {
      setUploadingAvatar(false)
    }
  }

  const validateForm = (): boolean => {
    let isValid = true

    // Validar nome
    if (!name || name.trim() === '') {
      setNameError('Nome é obrigatório')
      isValid = false
    } else {
      setNameError('')
    }

    // Validar data se preenchida
    if (birthDateDisplay && birthDateDisplay.length > 0 && birthDateDisplay.length < 10) {
      setBirthDateError('Data inválida. Use o formato dd/mm/yyyy')
      isValid = false
    } else if (birthDateError && birthDateError !== '') {
      isValid = false
    }

    return isValid
  }

  const handleSave = async () => {
    if (!user || !profile) return

    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Por favor, corrija os erros no formulário' })
      return
    }

    setSaving(true)

    try {
      let memberId = user.memberId
      if (!memberId) {
        try {
          const profileResponse = await api.get('/members/me')
          memberId = profileResponse.data.id
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Não foi possível obter o ID do membro. Faça login novamente.' })
          setSaving(false)
          return
        }
      }

      let avatarUrl: string | undefined = undefined

      // Upload do avatar se houver
      if (avatarUri) {
        avatarUrl = await uploadAvatar()
        if (!avatarUrl) {
          Toast.show({ type: 'error', text1: 'Erro ao fazer upload do avatar' })
          setSaving(false)
          return
        }
      }

      // Preparar dados para atualização
      const updateData: any = {}

      // Nome é obrigatório
      if (name && name.trim() !== '') {
        updateData.name = name.trim()
      } else {
        Toast.show({ type: 'error', text1: 'Nome é obrigatório' })
        setSaving(false)
        return
      }

      // Campos opcionais: sempre incluir (null quando vazio)
      updateData.phone = (phone || '').trim() || null
      updateData.address = (address || '').trim() || null

      // Data de nascimento: usar o valor do display (dd/mm/yyyy)
      const birthDateValue = birthDateDisplay?.trim() || ''
      if (birthDateValue && birthDateValue !== '' && birthDateValue.length === 10) {
        updateData.birthDate = birthDateValue
      } else {
        updateData.birthDate = null
      }

      // Não permite alterar positionId no próprio perfil
      // Não enviar positionId

      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl
      } else if (avatarUri === null && currentAvatarUrl === null) {
        // Se o avatar foi removido
        updateData.avatarUrl = null
      }

      const response = await api.put(`/members/${memberId}`, updateData)
      const updatedProfile = response.data

      Toast.show({ type: 'success', text1: 'Perfil atualizado com sucesso!' })

      // Atualizar o nome no authStore
      if (updatedProfile.name && updatedProfile.name !== user?.name) {
        updateUser({ name: updatedProfile.name })
      }

      // Limpar preview do avatar
      setAvatarUri(null)

      // Atualizar estados
      const updatedBirthDateDisplay = updatedProfile.birthDate ? formatDateToDisplay(updatedProfile.birthDate) : ''
      setBirthDateDisplay(updatedBirthDateDisplay)

      setName(updatedProfile.name || user.name || '')
      setPhone(updatedProfile.phone ?? '')
      setAddress(updatedProfile.address ?? '')

      if (updatedProfile.avatarUrl) {
        setCurrentAvatarUrl(updatedProfile.avatarUrl)
      } else {
        setCurrentAvatarUrl(null)
      }

      // Atualizar o usuário no store se necessário
      if (updatedProfile.name && updatedProfile.email) {
        const token = useAuthStore.getState().token
        if (token) {
          try {
            setUserFromToken(token)
          } catch (error) {
            console.error('Erro ao atualizar usuário no store:', error)
          }
        }
      }

      // Navegar de volta
      navigation.goBack()
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.error || error.response?.data?.message || 'Erro ao atualizar perfil',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Editar Perfil" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3366FF" />
        </View>
      </View>
    )
  }

  const currentPosition = positions.find(p => String(p.id) === positionId)

  return (
    <View style={styles.container}>
      <PageHeader title="Editar Perfil" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Gerencie suas informações pessoais</Text>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {(avatarUri || currentAvatarUrl) ? (
              <View style={styles.avatarPreview}>
                <Image
                  source={{
                    uri: avatarUri || (currentAvatarUrl?.startsWith('http')
                      ? currentAvatarUrl
                      : `${api.defaults.baseURL}${currentAvatarUrl}`),
                  }}
                  style={styles.avatarImage}
                />
                <TouchableOpacity
                  style={styles.removeAvatarButton}
                  onPress={handleRemoveAvatar}
                >
                  <Ionicons name="close-circle" size={24} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handlePickImage}
            disabled={uploadingAvatar}
          >
            <Ionicons name="camera-outline" size={20} color="#3366FF" />
            <Text style={styles.avatarButtonText}>
              {avatarUri || currentAvatarUrl ? 'Alterar Foto' : 'Adicionar Foto'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Máximo 5MB</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Nome */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Nome <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              placeholder="Seu nome completo"
              value={name}
              onChangeText={(text) => {
                setName(text)
                if (nameError) setNameError('')
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.hintText}>
              O email não pode ser alterado pelo próprio usuário. Entre em contato com um administrador.
            </Text>
          </View>

          {/* Telefone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Endereço */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número, bairro, cidade"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Data de Nascimento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput
              style={[styles.input, birthDateError && styles.inputError]}
              placeholder="dd/mm/yyyy"
              value={birthDateDisplay}
              onChangeText={handleBirthDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
            {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
          </View>

          {/* Cargo */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Cargo na Igreja</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={positionId}
                enabled={false}
                style={styles.picker}
              >
                <Picker.Item label={currentPosition?.name || 'Nenhum cargo'} value={positionId || ''} />
              </Picker>
            </View>
            <Text style={styles.hintText}>
              O cargo na igreja não pode ser alterado pelo próprio usuário. Entre em contato com um administrador.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || uploadingAvatar) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || uploadingAvatar}
        >
          {saving || uploadingAvatar ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  avatarSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarPreview: {
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#3366FF',
  },
  removeAvatarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3366FF',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#3366FF',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3366FF',
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  avatarButtonText: {
    color: '#3366FF',
    fontWeight: '500',
    fontSize: 14,
  },
  avatarHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3366FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})

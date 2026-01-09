import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
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
import { authService } from '../services/auth.service'
import { membersService } from '../services/members.service'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'
import GlassCard from '../components/GlassCard'

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
  const [error, setError] = useState<string | null>(null)
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
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err)
        const errorMessage = err.response?.data?.message || 'Não foi possível carregar os dados do perfil.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (!isInitialLoad) {
      loadProfile()
    }
  }, [user?.memberId, isInitialLoad])

  const handleRetry = async () => {
    if (!user?.memberId) return
    setLoading(true)
    setError(null)
    try {
      const profile = await authService.getCurrentUser()

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
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err)
      const errorMessage = err.response?.data?.message || 'Não foi possível carregar os dados do perfil.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

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
      } as unknown as Blob)

      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url
    } catch (error: unknown) {
      console.error('Erro ao fazer upload do avatar:', error)
      const apiError = error as { response?: { data?: { error?: string } } }
      Toast.show({ type: 'error', text1: apiError.response?.data?.error || 'Erro ao fazer upload do avatar' })
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
          const profile = await authService.getCurrentUser()
          memberId = profile.id
        } catch (error: unknown) {
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
      const updateData: Record<string, string | null | undefined> = {}

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

      const updatedProfile = await membersService.update(memberId, updateData)

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
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string; message?: string } } }
      Toast.show({
        type: 'error',
        text1: apiError.response?.data?.error || apiError.response?.data?.message || 'Erro ao atualizar perfil',
      })
    } finally {
      setSaving(false)
    }
  }

  const currentPosition = positions.find(p => String(p.id) === positionId)

  // Loading inicial considera tanto isInitialLoad quanto loading do perfil
  const initialLoading = isInitialLoad || loading

  return (
    <FormScreenLayout
      headerProps={{ title: "Editar Perfil" }}
      contentContainerStyle={styles.contentContainer}
      loading={initialLoading}
      error={error}
      onRetry={handleRetry}
    >
        <Text style={styles.subtitle}>Gerencie suas informações pessoais</Text>

        {/* Avatar Section */}
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.avatarSection}>
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
                  <Ionicons name="close-circle" size={24} color={colors.status.error} />
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
            <Ionicons name="camera-outline" size={20} color={colors.gradients.primary[1]} />
            <Text style={styles.avatarButtonText}>
              {avatarUri || currentAvatarUrl ? 'Alterar Foto' : 'Adicionar Foto'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Máximo 5MB</Text>
        </GlassCard>

        {/* Form Fields */}
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.formSection}>
          {/* Nome */}
          <TextInputField
            fieldKey="name"
            label="Nome"
            value={name}
            onChangeText={(text) => {
              setName(text)
              if (nameError) setNameError('')
            }}
            placeholder="Seu nome completo"
            required
            error={nameError}
          />

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            <Text style={styles.hintText}>
              O email não pode ser alterado pelo próprio usuário. Entre em contato com um administrador.
            </Text>
          </View>

          {/* Telefone */}
          <TextInputField
            fieldKey="phone"
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />

          {/* Endereço */}
          <TextInputField
            fieldKey="address"
            label="Endereço"
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, número, bairro, cidade"
          />

          {/* Data de Nascimento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, birthDateError && styles.inputError]}
                placeholder="dd/mm/yyyy"
                placeholderTextColor={colors.text.tertiary}
                value={birthDateDisplay}
                onChangeText={handleBirthDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
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
        </GlassCard>

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
    </FormScreenLayout>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  avatarSection: {
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
    borderColor: colors.gradients.primary[1],
  },
  removeAvatarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.glass.overlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.glass.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gradients.primary[1],
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.gradients.primary[1],
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gradients.primary[1],
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
    backgroundColor: colors.glass.overlay,
  },
  avatarButtonText: {
    color: colors.gradients.primary[1],
    fontWeight: '600',
    fontSize: 14,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  formSection: {
    padding: 16,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: colors.status.error,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: colors.glass.overlay,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...colors.shadow.glassLight,
    marginBottom: 0,
    padding: 0,
  },
  input: {
    borderWidth: 0,
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    backgroundColor: 'transparent',
    color: colors.text.tertiary,
  },
  inputError: {
    borderColor: colors.status.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.error,
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: 16,
    backgroundColor: colors.glass.overlay,
    overflow: 'hidden',
    ...colors.shadow.glassLight,
  },
  picker: {
    height: 50,
    color: colors.text.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gradients.primary[1],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    gap: 8,
    marginBottom: 24,
    ...colors.shadow.glassLight,
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

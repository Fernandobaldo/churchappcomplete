import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import { serviceScheduleApi, ServiceSchedule } from '../api/serviceScheduleApi'
import ServiceScheduleList from '../components/ServiceScheduleList'
import Toast from 'react-native-toast-message'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import { Church } from '../types'
import { colors } from '../theme/colors'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'

export default function ChurchSettingsScreen() {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [church, setChurch] = useState<Church | null>(null)
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [churchName, setChurchName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [schedulesExpanded, setSchedulesExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const canManageChurch = hasAccess(user, 'church_manage')

  const fetchSchedules = useCallback(async () => {
    if (!user?.branchId) return

    try {
      const data = await serviceScheduleApi.getByBranch(user.branchId)
      setSchedules(data)
    } catch (error: unknown) {
      console.error('Erro ao carregar horários:', error)
    }
  }, [user?.branchId])

  useEffect(() => {
    if (!canManageChurch) {
      Toast.show({ type: 'error', text1: 'Você não tem permissão para acessar esta área.' })
      navigation.goBack()
      return
    }

    fetchChurchData()
    fetchSchedules()
  }, [canManageChurch, user?.branchId, navigation, fetchSchedules])

  const fetchChurchData = useCallback(async () => {
    try {
      if (!user?.branchId) {
        Toast.show({ type: 'error', text1: 'Usuário não está associado a uma filial.' })
        return
      }

      const churchesResponse = await api.get('/churches')
      const churches = churchesResponse.data

      let userChurch: Church | null = null
      for (const church of churches) {
        if (church.Branch && Array.isArray(church.Branch)) {
          const hasUserBranch = church.Branch.some((b: any) => b.id === user.branchId)
          if (hasUserBranch) {
            userChurch = {
              id: church.id,
              name: church.name,
              logoUrl: church.logoUrl,
              avatarUrl: church.avatarUrl,
            }
            break
          }
        }
      }

      if (userChurch) {
        setChurch(userChurch)
        setChurchName(userChurch.name)
        setLogoUrl(userChurch.logoUrl || '')
        setCurrentAvatarUrl(userChurch.avatarUrl || null)
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar dados da igreja:', error)
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados da igreja' })
    } finally {
      setLoading(false)
    }
  }, [user?.branchId])

  // Recarrega dados quando a tela recebe foco (após editar/criar horário)
  useFocusEffect(
    useCallback(() => {
      if (canManageChurch) {
        fetchSchedules()
      }
    }, [canManageChurch, fetchSchedules])
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchChurchData(), fetchSchedules()])
    } finally {
      setRefreshing(false)
    }
  }, [fetchChurchData, fetchSchedules])

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
      
      // Criar FormData
      const formData = new FormData()
      const filename = avatarUri.split('/').pop() || 'avatar.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : `image/jpeg`
      
      formData.append('file', {
        uri: avatarUri,
        name: filename,
        type,
      } as unknown as Blob)

      const response = await api.post('/upload/church-avatar', formData, {
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

  const handleSaveChurch = useCallback(async () => {
    if (!church) return

    setSaving(true)
    try {
      let avatarUrl = currentAvatarUrl

      // Se há um novo avatar, faz upload primeiro
      if (avatarUri) {
        avatarUrl = await uploadAvatar()
        if (!avatarUrl) {
          Toast.show({ type: 'error', text1: 'Erro ao fazer upload do avatar' })
          setSaving(false)
          return
        }
      }

      // Se o avatar foi removido (avatarUri é null e currentAvatarUrl também)
      const finalAvatarUrl = avatarUri === null && currentAvatarUrl === null 
        ? null 
        : avatarUrl || currentAvatarUrl

      await api.put(`/churches/${church.id}`, {
        name: churchName,
        logoUrl: logoUrl || undefined,
        avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : undefined,
      })
      
      Toast.show({ type: 'success', text1: 'Configurações atualizadas com sucesso!' })
      setAvatarUri(null)
      fetchChurchData()
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } }
      Toast.show({ type: 'error', text1: apiError.response?.data?.message || 'Erro ao atualizar configurações' })
    } finally {
      setSaving(false)
    }
  }, [church, avatarUri, currentAvatarUrl, churchName, logoUrl, fetchChurchData])

  const handleEditSchedule = useCallback((schedule: ServiceSchedule) => {
    (navigation as any).navigate('ServiceScheduleForm', { schedule })
  }, [navigation])

  const handleDeleteSchedule = useCallback(async (id: string, deleteEvents: boolean) => {
    await fetchSchedules()
  }, [fetchSchedules])

  if (loading) {
    return (
      <ViewScreenLayout
        headerProps={{ title: "Configurações da Igreja" }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
        </View>
      </ViewScreenLayout>
    )
  }

  if (!canManageChurch || !church) {
    return null
  }

  return (
      <ViewScreenLayout
      headerProps={{ title: "Configurações da Igreja" }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Igreja</Text>
          
          {/* Avatar Section */}
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {(avatarUri || currentAvatarUrl) ? (
                <View style={styles.avatarPreview}>
                  <Image
                    source={{ uri: avatarUri || (currentAvatarUrl?.startsWith('http') ? currentAvatarUrl : `${api.defaults.baseURL}${currentAvatarUrl}`) }}
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
                  <Ionicons name="business-outline" size={32} color={colors.gradients.primary[1]} />
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
                {avatarUri || currentAvatarUrl ? 'Alterar Avatar' : 'Selecionar Avatar'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              O avatar da igreja será usado como padrão para todos os membros que não tiverem avatar próprio.
            </Text>
          </GlassCard>

          <TextInputField
            fieldKey="churchName"
            label="Nome da Igreja"
            value={churchName}
            onChangeText={setChurchName}
            placeholder="Nome da Igreja"
          />
          <TextInputField
            fieldKey="logoUrl"
            label="URL do Logo (opcional)"
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="URL do Logo (opcional)"
            keyboardType="url"
          />
          <TouchableOpacity
            style={[styles.button, (saving || uploadingAvatar) && styles.buttonDisabled]}
            onPress={handleSaveChurch}
            disabled={saving || uploadingAvatar}
          >
            <Text style={styles.buttonText}>
              {(saving || uploadingAvatar) ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.section}>
          <TouchableOpacity
            style={[styles.sectionHeader, schedulesExpanded && styles.sectionHeaderExpanded]}
            onPress={() => setSchedulesExpanded(!schedulesExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Horários de Culto</Text>
            <Ionicons
              name={schedulesExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.gradients.primary[1]}
            />
          </TouchableOpacity>

          {schedulesExpanded && (
            <View style={styles.schedulesContent}>
              <ServiceScheduleList
                schedules={schedules}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
                onRefresh={fetchSchedules}
              />
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('ServiceScheduleForm', { schedule: null })}
                style={styles.addScheduleButton}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={colors.gradients.primary[1]} />
                <Text style={styles.addScheduleButtonText}>Adicionar Horário</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>
    </ViewScreenLayout>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionHeaderExpanded: {
    marginBottom: 16,
  },
  schedulesContent: {
    marginTop: 8,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.gradients.primary[1],
    borderRadius: 16,
    backgroundColor: colors.glass.overlay,
    gap: 8,
  },
  addScheduleButtonText: {
    color: colors.gradients.primary[1],
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.gradients.primary[1],
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    ...colors.shadow.glassLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    padding: 20,
  },
  avatarSection: {
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPreview: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.glass.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
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
    textAlign: 'center',
  },
})


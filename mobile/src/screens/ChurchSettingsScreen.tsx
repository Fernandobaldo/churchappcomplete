import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import { serviceScheduleApi, ServiceSchedule } from '../api/serviceScheduleApi'
import Toast from 'react-native-toast-message'
import PageHeader from '../components/PageHeader'

interface Church {
  id: string
  name: string
  logoUrl?: string
  avatarUrl?: string | null
}

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

  const canManageChurch = hasAccess(user, 'church_manage')

  useEffect(() => {
    if (!canManageChurch) {
      Toast.show({ type: 'error', text1: 'Você não tem permissão para acessar esta área.' })
      navigation.goBack()
      return
    }

    fetchChurchData()
    fetchSchedules()
  }, [canManageChurch, user?.branchId])

  const fetchChurchData = async () => {
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
    } catch (error: any) {
      console.error('Erro ao carregar dados da igreja:', error)
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados da igreja' })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    if (!user?.branchId) return

    try {
      const data = await serviceScheduleApi.getByBranch(user.branchId)
      setSchedules(data)
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error)
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
      
      // Criar FormData
      const formData = new FormData()
      const filename = avatarUri.split('/').pop() || 'avatar.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : `image/jpeg`
      
      formData.append('file', {
        uri: avatarUri,
        name: filename,
        type,
      } as any)

      const response = await api.post('/upload/church-avatar', formData, {
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

  const handleSaveChurch = async () => {
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
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao atualizar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await serviceScheduleApi.setDefault(id)
      Toast.show({ type: 'success', text1: 'Horário definido como padrão!' })
      fetchSchedules()
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao definir horário como padrão' })
    }
  }

  const handleCreateEvents = (schedule: ServiceSchedule) => {
    Alert.alert(
      'Criar Eventos',
      `Criar eventos a partir do horário "${schedule.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Criar',
          onPress: async () => {
            try {
              const result = await serviceScheduleApi.createEvents(schedule.id)
              Toast.show({
                type: 'success',
                text1: `${result.created} eventos criados com sucesso!`,
              })
              fetchSchedules()
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao criar eventos' })
            }
          },
        },
      ]
    )
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      // Conta eventos relacionados antes de mostrar a confirmação
      const { count, scheduleTitle } = await serviceScheduleApi.getRelatedEventsCount(id)
      
      let message = `Tem certeza que deseja deletar o horário "${scheduleTitle}"?`
      if (count > 0) {
        message += `\n\n⚠️ ATENÇÃO: Ao deletar este horário de culto, ${count} evento(s) criado(s) a partir dele também serão deletados.`
      }
      
      Alert.alert('Confirmar Deleção', message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Se houver eventos, pergunta se deve deletá-los também
              let deleteEvents = false
              if (count > 0) {
                Alert.alert(
                  'Deletar Eventos?',
                  `Deseja deletar os ${count} evento(s) relacionados junto com o horário?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Deletar apenas o horário',
                      onPress: async () => {
                        try {
                          const result = await serviceScheduleApi.delete(id, false)
                          Toast.show({ 
                            type: 'success', 
                            text1: 'Horário deletado com sucesso!',
                            text2: `${result.relatedEventsCount} evento(s) permaneceram no calendário.`
                          })
                          fetchSchedules()
                        } catch (error: any) {
                          Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao deletar horário' })
                        }
                      },
                    },
                    {
                      text: 'Deletar horário e eventos',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const result = await serviceScheduleApi.delete(id, true)
                          let successMessage = 'Horário deletado com sucesso!'
                          if (result.deletedEventsCount > 0) {
                            successMessage += ` ${result.deletedEventsCount} evento(s) também foram deletado(s).`
                          }
                          Toast.show({ type: 'success', text1: successMessage })
                          fetchSchedules()
                        } catch (error: any) {
                          Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao deletar horário' })
                        }
                      },
                    },
                  ]
                )
              } else {
                // Não há eventos, pode deletar diretamente
                await serviceScheduleApi.delete(id, false)
                Toast.show({ type: 'success', text1: 'Horário deletado com sucesso!' })
                fetchSchedules()
              }
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao deletar horário' })
            }
          },
        },
      ])
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao verificar eventos relacionados' })
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3366FF" />
      </View>
    )
  }

  if (!canManageChurch || !church) {
    return null
  }

  const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  return (
    <View style={styles.container}>
      <PageHeader title="Configurações da Igreja" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Igreja</Text>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
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
                    <Ionicons name="close-circle" size={24} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="church" size={32} color="#3366FF" />
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
                {avatarUri || currentAvatarUrl ? 'Alterar Avatar' : 'Selecionar Avatar'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              O avatar da igreja será usado como padrão para todos os membros que não tiverem avatar próprio.
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nome da Igreja"
            value={churchName}
            onChangeText={setChurchName}
          />
          <TextInput
            style={styles.input}
            placeholder="URL do Logo (opcional)"
            value={logoUrl}
            onChangeText={setLogoUrl}
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Horários de Culto</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ServiceScheduleForm' as never, { schedule: null })}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={24} color="#3366FF" />
            </TouchableOpacity>
          </View>

          {schedules.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum horário cadastrado.</Text>
          ) : (
            schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                  {schedule.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.defaultText}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.scheduleInfo}>
                  {DAYS_OF_WEEK[schedule.dayOfWeek]} às {schedule.time}
                </Text>
                {schedule.location && <Text style={styles.scheduleInfo}>{schedule.location}</Text>}
                {schedule.autoCreateEvents && (
                  <Text style={styles.scheduleInfo}>
                    Auto-criar eventos ({schedule.autoCreateDaysAhead || 90} dias)
                  </Text>
                )}
                {schedule.description && (
                  <Text style={styles.scheduleDescription}>{schedule.description}</Text>
                )}
                <View style={styles.scheduleActions}>
                  {!schedule.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(schedule.id)}
                      style={styles.actionButton}
                      title="Definir como padrão"
                    >
                      <Ionicons name="star-outline" size={20} color="#FFD700" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleCreateEvents(schedule)}
                    style={styles.actionButton}
                    title="Criar eventos a partir deste horário"
                  >
                    <Ionicons name="calendar-outline" size={20} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ServiceScheduleForm' as never, { schedule })}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={20} color="#3366FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteSchedule(schedule.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
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
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3366FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
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
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  scheduleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  scheduleDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  avatarSection: {
    marginBottom: 16,
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
  },
  removeAvatarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
})


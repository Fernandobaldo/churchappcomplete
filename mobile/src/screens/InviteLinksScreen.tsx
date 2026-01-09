import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Switch,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import GlassFormModal from '../components/GlassFormModal'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import PlanUpgradeModal from '../components/PlanUpgradeModal'
import Tabs from '../components/Tabs'
import { colors } from '../theme/colors'
import { EmptyState } from '../components/states'
import DateTimePickerComponent from '../components/DateTimePicker'
import TextInputField from '../components/TextInputField'

interface InviteLink {
  id: string
  token: string
  branchId: string
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  creatorName?: string
  creatorEmail?: string | null
  Branch: {
    name: string
    Church: {
      name: string
    }
  }
}

export default function InviteLinksScreen() {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [links, setLinks] = useState<InviteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<{ name: string; maxMembers: number | null } | undefined>()
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [formData, setFormData] = useState({
    maxUses: '',
    isUnlimited: true,
    expiresAt: null as Date | null,
  })

  const fetchLinks = useCallback(async () => {
    if (!user?.branchId) return

    try {
      setError(null)
      const response = await api.get(`/invite-links/branch/${user.branchId}`)
      setLinks(response.data || [])
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao carregar links de convite'
      setError(errorMessage)
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.branchId])

  useEffect(() => {
    if (user?.branchId) {
      const loadLinks = async () => {
        setLoading(true)
        await fetchLinks()
      }
      loadLinks()
    }
  }, [user?.branchId, fetchLinks])

  // Recarrega quando a tela ganha foco (após voltar de criar link)
  useFocusEffect(
    useCallback(() => {
      if (user?.branchId && !loading && !refreshing) {
        fetchLinks()
      }
    }, [fetchLinks, user?.branchId, loading, refreshing])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchLinks()
  }, [fetchLinks])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchLinks().finally(() => setLoading(false))
  }, [fetchLinks])

  const handleCreateLink = async () => {
    if (!user?.branchId) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Filial não identificada',
      })
      return
    }

    try {
      setCreating(true)
      const payload: any = {
        branchId: user.branchId,
      }

      if (formData.isUnlimited) {
        payload.maxUses = null
      } else {
        const maxUsesNum = parseInt(formData.maxUses)
        if (isNaN(maxUsesNum) || maxUsesNum <= 0) {
          Toast.show({
            type: 'error',
            text1: 'Erro',
            text2: 'Por favor, informe um limite de usos válido',
          })
          setCreating(false)
          return
        }
        payload.maxUses = maxUsesNum
      }

      if (formData.expiresAt) {
        payload.expiresAt = formData.expiresAt.toISOString()
      } else {
        payload.expiresAt = null
      }

      await api.post('/invite-links', payload)
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Link de convite criado com sucesso!',
      })
      setShowCreateModal(false)
      setFormData({ maxUses: '', isUnlimited: true, expiresAt: null })
      fetchLinks()
    } catch (error: any) {
      if (error.response?.data?.code === 'PLAN_LIMIT_REACHED' || error.response?.data?.error === 'PLAN_LIMIT_REACHED') {
        // Buscar informações do plano atual
        try {
          const planResponse = await api.get('/subscriptions/current')
          setCurrentPlan({
            name: planResponse.data?.plan?.name || 'Free',
            maxMembers: planResponse.data?.plan?.maxMembers || null,
          })
        } catch {
          // Se não conseguir buscar, usa valores padrão
          setCurrentPlan({
            name: 'Free',
            maxMembers: 10,
          })
        }
        setShowUpgradeModal(true)
        Toast.show({
          type: 'error',
          text1: 'Limite Atingido',
          text2: 'Limite de membros do plano atingido. Faça upgrade para continuar.',
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: error.response?.data?.error || error.response?.data?.message || 'Erro ao criar link de convite',
        })
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (linkId: string) => {
    Alert.alert(
      'Desativar Link',
      'Tem certeza que deseja desativar este link?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/invite-links/${linkId}/deactivate`)
              Toast.show({
                type: 'success',
                text1: 'Sucesso',
                text2: 'Link desativado com sucesso!',
              })
              fetchLinks()
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: error.response?.data?.error || 'Erro ao desativar link',
              })
            }
          },
        },
      ]
    )
  }

  const handleShareLink = async (token: string) => {
    const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/register/invite/${token}`

    try {
      await Share.share({
        message: `Convite para registro na igreja: ${inviteUrl}`,
        url: inviteUrl,
      })
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
    }
  }

  const getQRCodeUrl = (token: string) => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333'
    return `${apiUrl}/invite-links/${token}/qrcode`
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Não expira'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    // Validação no frontend: link expira apenas quando now > expiresAt (estritamente maior)
    // O backend já normaliza para fim do dia, então aqui apenas comparamos
    const expiresDate = new Date(expiresAt)
    const now = new Date()
    return now > expiresDate
  }

  const isLimitReached = (link: InviteLink) => {
    if (link.maxUses === null) return false
    return link.currentUses >= link.maxUses
  }

  const filteredLinks = links.filter((link) => 
    activeTab === 'active' ? link.isActive : !link.isActive
  )

  // Global empty: verifica se TODAS as tabs estão vazias
  const isGlobalEmpty = !loading && links.length === 0 && !error
  // Tab empty: verifica se apenas a tab atual está vazia
  const isTabEmpty = !loading && filteredLinks.length === 0 && !error && links.length > 0

  return (
    <>
    <ViewScreenLayout
      headerProps={{
        title: "Links de Convite",
        Icon: FontAwesome5,
        iconName: "link",
      }}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      loading={loading}
      error={error}
      empty={isGlobalEmpty}
      emptyTitle="Nenhum link de convite encontrado"
      emptySubtitle="Crie um novo link de convite para compartilhar"
      onRetry={handleRetry}
      floatingSlot={
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      }
    >
      {/* Tabs */}
      <Tabs
        tabs={[
          {
            key: 'active',
            label: 'Ativos',
            badge: links.filter((l) => l.isActive).length > 0 
              ? links.filter((l) => l.isActive).length 
              : undefined,
          },
          {
            key: 'inactive',
            label: 'Desativados',
            badge: links.filter((l) => !l.isActive).length > 0 
              ? links.filter((l) => !l.isActive).length 
              : undefined,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as 'active' | 'inactive')}
        style={styles.tabsContainer}
      />

      <FlatList
        data={filteredLinks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          isTabEmpty ? (
            <EmptyState
              title={activeTab === 'active' ? 'Nenhum link ativo' : 'Nenhum link desativado'}
              subtitle="Quando houver links nesta categoria, eles aparecerão aqui"
            />
          ) : null
        }
        renderItem={({ item: link }) => (
          <GlassCard
            opacity={(!link.isActive || isExpired(link.expiresAt) || isLimitReached(link)) ? 0.3 : 0.4}
            blurIntensity={20}
            borderRadius={20}
            style={styles.linkCard}
          >
            <View style={styles.linkHeader}>
              <Text style={styles.linkTitle}>Link de Convite</Text>
              <View style={styles.badgesContainer}>
                {!link.isActive && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Desativado</Text>
                  </View>
                )}
                {link.isActive && isExpired(link.expiresAt) && (
                  <View style={[styles.badge, styles.badgeError]}>
                    <Text style={styles.badgeText}>Expirado</Text>
                  </View>
                )}
                {link.isActive && isLimitReached(link) && (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={styles.badgeText}>Limite Atingido</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.linkInfo}>
              Igreja: <Text style={styles.linkInfoBold}>{link.Branch.Church.name}</Text>
            </Text>
            {link.creatorName && (
              <Text style={styles.linkInfo}>
                Criado por: <Text style={styles.linkInfoBold}>{link.creatorName}</Text>
              </Text>
            )}
            <Text style={styles.linkInfo}>
              Criado em: {new Date(link.createdAt).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.linkInfo}>
              Expira em: {formatDate(link.expiresAt)}
            </Text>
            <Text style={styles.linkInfo}>
              Usos: {link.currentUses} /{' '}
              {link.maxUses === null ? 'Ilimitado' : link.maxUses}
            </Text>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleShareLink(link.token)}
              >
                <Ionicons name="share-outline" size={20} color={colors.gradients.primary[1]} />
                <Text style={styles.actionButtonText}>Compartilhar</Text>
              </TouchableOpacity>
              {link.isActive && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => handleDeactivate(link.id)}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.status.error} />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                    Desativar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        )}
      />
    </ViewScreenLayout>

      {/* Modal de Criação */}
      <GlassFormModal
        visible={showCreateModal}
        title="Criar Novo Link de Convite"
        onClose={() => {
          setShowCreateModal(false)
          setFormData({ maxUses: '', isUnlimited: true, expiresAt: null })
        }}
        onSubmit={handleCreateLink}
        submitLabel="Criar Link"
        cancelLabel="Cancelar"
        loading={creating}
        position="bottom"
      >
        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Ilimitado</Text>
            <Switch
              value={formData.isUnlimited}
              onValueChange={(value) => setFormData({ ...formData, isUnlimited: value, maxUses: value ? '' : formData.maxUses })}
              trackColor={{ false: '#CBD5E1', true: colors.gradients.primary[1] }}
              thumbColor={formData.isUnlimited ? '#FFFFFF' : '#F1F5F9'}
              ios_backgroundColor="#CBD5E1"
            />
          </View>
          {!formData.isUnlimited && (
            <TextInputField
              fieldKey="maxUses"
              label="Limite de Usos"
              value={formData.maxUses}
              onChangeText={(text) => {
                // Apenas números inteiros
                const numericValue = text.replace(/[^0-9]/g, '')
                setFormData({ ...formData, maxUses: numericValue })
              }}
              placeholder="Ex: 10, 25, 50, 100"
              keyboardType="numeric"
              required
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <DateTimePickerComponent
            label="Data de Expiração (opcional)"
            value={formData.expiresAt}
            onChange={(value) => {
              // DateTimePickerComponent retorna string no formato 'dd/MM/yyyy' quando mode='date'
              if (typeof value === 'string') {
                // Parse da string para Date
                // Criar data no fim do dia (23:59:59.999) para garantir que seja válida até o final do dia
                const [day, month, year] = value.split('/').map(Number)
                const dateValue = new Date(year, month - 1, day, 23, 59, 59, 999)
                setFormData({ ...formData, expiresAt: dateValue })
              } else if (value instanceof Date) {
                // Se já é um Date, garantir que está no fim do dia se não tiver hora específica
                const hours = value.getHours()
                const minutes = value.getMinutes()
                const seconds = value.getSeconds()
                const milliseconds = value.getMilliseconds()
                
                // Se for meia-noite (00:00:00.000), converter para fim do dia
                if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
                  const endOfDay = new Date(value)
                  endOfDay.setHours(23, 59, 59, 999)
                  setFormData({ ...formData, expiresAt: endOfDay })
                } else {
                  setFormData({ ...formData, expiresAt: value })
                }
              } else {
                setFormData({ ...formData, expiresAt: null })
              }
            }}
            mode="date"
            placeholder="Selecione a data (opcional)"
            minimumDate={new Date()}
          />
        </View>
      </GlassFormModal>

      {/* Modal de Upgrade de Plano */}
      <PlanUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
      />
    </>
  )
}

const styles = StyleSheet.create({
  tabsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  linkCard: {
    padding: 20,
    marginBottom: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeError: {
    backgroundColor: '#fee2e2',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  linkInfo: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  linkInfoBold: {
    fontWeight: '600',
    color: '#0F172A',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3366FF',
  },
  actionButtonDanger: {
    borderColor: '#EF4444',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#3366FF',
    fontWeight: '500',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...colors.shadow.glassHeavy,
  },
  fabGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsContainerWithHeader: {
    marginTop: 110, // Altura do header fixo
  },
})


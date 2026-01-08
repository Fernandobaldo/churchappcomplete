import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import PlanUpgradeModal from '../components/PlanUpgradeModal'
import Tabs from '../components/Tabs'
import { colors } from '../theme/colors'

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
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<{ name: string; maxMembers: number | null } | undefined>()
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [formData, setFormData] = useState({
    maxUses: 'unlimited' as string,
    expiresAt: '',
  })

  useEffect(() => {
    if (user?.branchId) {
      setLoading(true)
      fetchLinks()
    }
  }, [user?.branchId])

  const fetchLinks = async () => {
    if (!user?.branchId) return

    try {
      const response = await api.get(`/invite-links/branch/${user.branchId}`)
      setLinks(response.data)
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.response?.data?.error || 'Erro ao carregar links de convite',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchLinks()
  }

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

      if (formData.maxUses && formData.maxUses !== 'unlimited') {
        payload.maxUses = parseInt(formData.maxUses)
      } else {
        payload.maxUses = null
      }

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString()
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
      setFormData({ maxUses: 'unlimited', expiresAt: '' })
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
    return new Date(expiresAt) < new Date()
  }

  const isLimitReached = (link: InviteLink) => {
    if (link.maxUses === null) return false
    return link.currentUses >= link.maxUses
  }

  const filteredLinks = links.filter((link) => 
    activeTab === 'active' ? link.isActive : !link.isActive
  )

  return (
    <>
    <ViewScreenLayout
      headerProps={{
        title: "Links de Convite",
        Icon: FontAwesome5,
        iconName: "link",
      }}
      scrollable={false}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={colors.gradients.primary}
            tintColor={colors.gradients.primary[1]}
          />
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
        ListEmptyComponent={
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.emptyContainer}>
            <Ionicons name="link-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'Nenhum link ativo' 
                : 'Nenhum link desativado'}
            </Text>
          </GlassCard>
        }
      />

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
    </ViewScreenLayout>

      {/* Modal de Criação */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Link de Convite</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Limite de Usos</Text>
              <View style={styles.radioGroup}>
                {['unlimited', '10', '25', '50', '100'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.radioOption,
                      formData.maxUses === value && styles.radioOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, maxUses: value })}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.maxUses === value && styles.radioTextSelected,
                      ]}
                    >
                      {value === 'unlimited' ? 'Ilimitado' : `${value} usos`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Data de Expiração (opcional)</Text>
              <Text style={styles.hint}>
                Deixe em branco para link sem expiração
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false)
                  setFormData({ maxUses: 'unlimited', expiresAt: '' })
                }}
                disabled={creating}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateLink}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Criar Link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#475569',
    marginTop: 16,
    textAlign: 'center',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  radioOptionSelected: {
    borderColor: '#3366FF',
    backgroundColor: '#eef2ff',
  },
  radioText: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioTextSelected: {
    color: '#3366FF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonPrimary: {
    backgroundColor: '#3366FF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
  tabsContainerWithHeader: {
    marginTop: 110, // Altura do header fixo
  },
})


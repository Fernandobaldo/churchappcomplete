import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { subscriptionApi } from '../api/api'
import Toast from 'react-native-toast-message'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import { colors } from '../theme/colors'
import { Linking } from 'react-native'

interface Subscription {
  id: string
  status: 'pending' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  plan: {
    id: string
    name: string
    price: number
  }
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  paymentHistory: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paidAt: string | null
  }>
}

const statusConfig = {
  pending: {
    label: 'Aguardando Pagamento',
    iconName: 'time-outline' as const,
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  active: {
    label: 'Ativa',
    iconName: 'checkmark-circle-outline' as const,
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
  },
  past_due: {
    label: 'Pagamento Atrasado',
    iconName: 'alert-circle-outline' as const,
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
  },
  canceled: {
    label: 'Cancelada',
    iconName: 'close-circle-outline' as const,
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  unpaid: {
    label: 'Não Pago',
    iconName: 'close-circle-outline' as const,
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  trialing: {
    label: 'Período de Teste',
    iconName: 'time-outline' as const,
    color: '#2563eb',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
}

export default function SubscriptionScreen() {
  const navigation = useNavigation()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const response = await subscriptionApi.getMySubscription()
      setSubscription(response.subscription)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSubscription(null)
      } else {
        Toast.show({ type: 'error', text1: 'Erro ao carregar assinatura' })
        console.error(error)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadSubscription()
  }, [loadSubscription])

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Assinatura',
      'Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o fim do período atual.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true)
              await subscriptionApi.cancel(true)
              Toast.show({
                type: 'success',
                text1: 'Assinatura cancelada',
                text2: 'Você manterá acesso até o fim do período.',
              })
              loadSubscription()
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: error.response?.data?.error || 'Erro ao cancelar assinatura',
              })
            } finally {
              setActionLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleResume = async () => {
    try {
      setActionLoading(true)
      await subscriptionApi.resume()
      Toast.show({ type: 'success', text1: 'Assinatura retomada com sucesso!' })
      loadSubscription()
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.error || 'Erro ao retomar assinatura',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <ViewScreenLayout
        headerProps={{ title: "Minha Assinatura" }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
        </View>
      </ViewScreenLayout>
    )
  }

  if (!subscription) {
    return (
      <ViewScreenLayout
        headerProps={{ title: "Minha Assinatura" }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.emptyCard}>
            <Ionicons name="card-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Nenhuma Assinatura Ativa</Text>
            <Text style={styles.emptyText}>
              Você ainda não possui uma assinatura ativa. Escolha um plano para começar.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Dashboard' as never)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Ver Planos</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </ViewScreenLayout>
    )
  }

  const statusInfo = statusConfig[subscription.status]

  return (
    <ViewScreenLayout
      headerProps={{ title: "Minha Assinatura" }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Gerencie sua assinatura e visualize o histórico de pagamentos</Text>

        {/* Status Card */}
        <GlassCard opacity={0.45} blurIntensity={20} borderRadius={20} style={[styles.statusCard, { borderColor: statusInfo.borderColor }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.bgColor }]}>
                <Ionicons name={statusInfo.iconName} size={24} color={statusInfo.color} />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Status da Assinatura</Text>
                <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
            {subscription.status === 'canceled' && !subscription.cancelAtPeriodEnd && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleResume}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={actionLoading ? ['#94A3B8', '#94A3B8'] : [colors.status.success, '#16a34a'] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>
                    {actionLoading ? 'Processando...' : 'Retomar'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCancel}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={actionLoading ? ['#94A3B8', '#94A3B8'] : [colors.status.error, '#DC2626'] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>
                    {actionLoading ? 'Processando...' : 'Cancelar'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {subscription.cancelAtPeriodEnd && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Sua assinatura será cancelada ao fim do período atual ({formatDate(subscription.currentPeriodEnd)})
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Plan Info */}
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
          <Text style={styles.cardTitle}>Informações do Plano</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Plano</Text>
              <Text style={styles.infoValue}>{subscription.plan.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Valor Mensal</Text>
              <Text style={styles.infoValue}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(subscription.plan.price)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Período Atual</Text>
              <Text style={styles.infoValue}>
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Próxima Cobrança</Text>
              <Text style={styles.infoValue}>
                {formatDate(subscription.currentPeriodEnd)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Payment History */}
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
          <Text style={styles.cardTitle}>Histórico de Pagamentos</Text>
          {subscription.paymentHistory.length === 0 ? (
            <Text style={styles.emptyPaymentText}>Nenhum pagamento registrado ainda</Text>
          ) : (
            <View style={styles.paymentList}>
              {subscription.paymentHistory.map((payment) => (
                <GlassCard key={payment.id} opacity={0.35} blurIntensity={20} borderRadius={16} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Ionicons name="card-outline" size={20} color="#9ca3af" />
                    <View style={styles.paymentDetails}>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </Text>
                      <Text style={styles.paymentDate}>
                        {payment.paidAt ? formatDate(payment.paidAt) : 'Aguardando pagamento'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.paymentStatusBadge,
                    payment.status === 'approved'
                      ? styles.statusApproved
                      : payment.status === 'pending'
                      ? styles.statusPending
                      : styles.statusFailed
                  ]}>
                    <Text style={styles.paymentStatusText}>
                      {payment.status === 'approved'
                        ? 'Pago'
                        : payment.status === 'pending'
                        ? 'Pendente'
                        : 'Falhou'}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </ViewScreenLayout>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  statusCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  warningBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  emptyPaymentText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    padding: 32,
  },
  paymentList: {
    gap: 12,
    marginTop: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentDetails: {
    marginLeft: 12,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: '#64748B',
  },
  paymentStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
})


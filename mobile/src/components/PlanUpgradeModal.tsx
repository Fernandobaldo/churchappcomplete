import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { subscriptionApi, plansApi } from '../api/api'
import Toast from 'react-native-toast-message'

interface PlanUpgradeModalProps {
  visible: boolean
  onClose: () => void
  currentPlan?: {
    name: string
    maxMembers: number | null
  }
}

interface Plan {
  id: string
  name: string
  price: number
  maxMembers: number | null
  maxBranches: number | null
  features: string[]
  isActive: boolean
  popular?: boolean
}

export default function PlanUpgradeModal({
  visible,
  onClose,
  currentPlan,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadPlans()
    }
  }, [visible])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await plansApi.getAll()
      // Filtrar apenas planos ativos e ordenar por preço
      const activePlans = (Array.isArray(response) ? response : response.plans || [])
        .filter((plan: Plan) => plan.isActive !== false)
        .sort((a: Plan, b: Plan) => a.price - b.price)
      
      // Marcar o plano do meio como popular (se houver 3+ planos)
      if (activePlans.length >= 3) {
        const middleIndex = Math.floor(activePlans.length / 2)
        activePlans[middleIndex].popular = true
      }
      
      setPlans(activePlans)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      Toast.show({ type: 'error', text1: 'Erro ao carregar planos' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      const response = await subscriptionApi.checkout(planId, 7) // 7 dias de trial
      
      // Se houver checkoutUrl (MercadoPago), abrir no navegador
      if (response.subscription?.checkoutUrl) {
        Toast.show({ type: 'success', text1: 'Redirecionando para o checkout...' })
        const canOpen = await Linking.canOpenURL(response.subscription.checkoutUrl)
        if (canOpen) {
          await Linking.openURL(response.subscription.checkoutUrl)
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o link de checkout')
        }
        onClose()
      } else {
        // Se não houver (pagamento direto), mostrar sucesso
        Toast.show({ type: 'success', text1: 'Assinatura criada com sucesso!' })
        onClose()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erro ao criar assinatura'
      Toast.show({ type: 'error', text1: errorMessage })
      console.error('Erro ao fazer upgrade:', error)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Upgrade do Plano</Text>
              <Text style={styles.subtitle}>
                Seu plano atual atingiu o limite de membros. Escolha um plano superior para
                continuar.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Current Plan Info */}
          {currentPlan && (
            <View style={styles.currentPlanContainer}>
              <Ionicons name="star" size={20} color="#2563eb" />
              <Text style={styles.currentPlanText}>
                Plano Atual: <Text style={styles.currentPlanBold}>{currentPlan.name}</Text>
                {currentPlan.maxMembers && (
                  <Text style={styles.currentPlanLimit}>
                    {' '}
                    (Limite: {currentPlan.maxMembers} membros)
                  </Text>
                )}
              </Text>
            </View>
          )}

          {/* Plans List */}
          <ScrollView style={styles.plansContainer} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3366FF" />
                <Text style={styles.loadingText}>Carregando planos...</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Nenhum plano disponível</Text>
              </View>
            ) : (
              plans.map((plan) => {
              const isCurrentPlan =
                currentPlan?.name.toLowerCase() === plan.name.toLowerCase()
              const isSelected = selectedPlan === plan.id

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.popular && styles.planCardPopular,
                    isSelected && styles.planCardSelected,
                    isCurrentPlan && styles.planCardCurrent,
                  ]}
                  onPress={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                  disabled={isCurrentPlan}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}

                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>ATUAL</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPriceContainer}>
                      <Text style={styles.planPrice}>R$ {plan.price.toFixed(2)}</Text>
                      <Text style={styles.planPricePeriod}>/mês</Text>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      isCurrentPlan && styles.upgradeButtonDisabled,
                      plan.popular && !isCurrentPlan && styles.upgradeButtonPopular,
                    ]}
                    onPress={() => !isCurrentPlan && handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || upgrading}
                  >
                    {upgrading && selectedPlan === plan.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.upgradeButtonText,
                          isCurrentPlan && styles.upgradeButtonTextDisabled,
                        ]}
                      >
                        {isCurrentPlan ? 'Plano Atual' : 'Escolher Plano'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            }))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 <Text style={styles.footerBold}>Dica:</Text> Você pode fazer upgrade a qualquer
              momento. O valor será calculado proporcionalmente.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  currentPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  currentPlanText: {
    fontSize: 14,
    color: '#1e40af',
  },
  currentPlanBold: {
    fontWeight: '600',
  },
  currentPlanLimit: {
    color: '#1e3a8a',
  },
  plansContainer: {
    flex: 1,
    padding: 16,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  planCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  planCardCurrent: {
    backgroundColor: '#f9fafb',
    opacity: 0.75,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6b7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  planPricePeriod: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonPopular: {
    backgroundColor: '#3b82f6',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  upgradeButtonTextDisabled: {
    color: '#6b7280',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerBold: {
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
})




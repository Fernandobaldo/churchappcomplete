import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
  popular?: boolean
}

// Planos mockados - em produção viriam da API
const mockPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxMembers: 10,
    maxBranches: 1,
    features: ['Até 10 membros', '1 filial', 'Funcionalidades básicas'],
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 29.9,
    maxMembers: 50,
    maxBranches: 3,
    features: [
      'Até 50 membros',
      'Até 3 filiais',
      'Todas as funcionalidades básicas',
      'Suporte por email',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79.9,
    maxMembers: 200,
    maxBranches: 10,
    features: [
      'Até 200 membros',
      'Até 10 filiais',
      'Todas as funcionalidades',
      'Suporte prioritário',
      'Relatórios avançados',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.9,
    maxMembers: null,
    maxBranches: null,
    features: [
      'Membros ilimitados',
      'Filiais ilimitadas',
      'Todas as funcionalidades',
      'Suporte 24/7',
      'Relatórios personalizados',
      'API dedicada',
    ],
  },
]

export default function PlanUpgradeModal({
  visible,
  onClose,
  currentPlan,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      // TODO: Implementar chamada real à API quando estiver disponível
      // await api.post('/subscriptions/upgrade', { planId })

      // Mock por enquanto
      await new Promise((resolve) => setTimeout(resolve, 1500))

      alert(`Upgrade para o plano ${mockPlans.find((p) => p.id === planId)?.name} realizado com sucesso!`)
      onClose()
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error)
      alert('Erro ao fazer upgrade. Tente novamente.')
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
            {mockPlans.map((plan) => {
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
            })}
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
})




import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { subscriptionApi } from '../api/api'
import PageHeader from '../components/PageHeader'

export default function SubscriptionSuccessScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  useEffect(() => {
    if (!loading) {
      // Redirecionar para dashboard após 5 segundos
      const timer = setTimeout(() => {
        navigation.navigate('Dashboard' as never)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [loading, navigation])

  const checkSubscription = async () => {
    try {
      const response = await subscriptionApi.getMySubscription()
      setSubscription(response.subscription)
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Assinatura" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3366FF" />
        </View>
      </View>
    )
  }

  const getStatusLabel = () => {
    if (subscription?.status === 'pending') {
      return 'Aguardando Pagamento'
    } else if (subscription?.status === 'trialing') {
      return 'Período de Teste'
    } else {
      return 'Ativa'
    }
  }

  const getStatusMessage = () => {
    if (subscription?.status === 'pending') {
      return 'Sua assinatura foi criada e está aguardando confirmação do pagamento. Você receberá um email assim que o pagamento for confirmado.'
    } else if (subscription?.status === 'trialing') {
      return 'Você está no período de teste! Sua assinatura será ativada automaticamente após o período de teste.'
    } else {
      return 'Sua assinatura está ativa! Você já pode usar todos os recursos do seu plano.'
    }
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Assinatura" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
            </View>
          </View>

          <Text style={styles.title}>Assinatura Criada com Sucesso!</Text>

          <Text style={styles.message}>{getStatusMessage()}</Text>

          {subscription && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plano:</Text>
                <Text style={styles.infoValue}>{subscription.plan?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{getStatusLabel()}</Text>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('Subscription' as never)}
            >
              <Text style={styles.primaryButtonText}>Ver Detalhes da Assinatura</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Dashboard' as never)}
            >
              <Text style={styles.secondaryButtonText}>Ir para Dashboard</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.redirectText}>
            Você será redirecionado automaticamente em alguns segundos...
          </Text>
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
  scrollContent: {
    padding: 16,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3366FF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  redirectText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
  },
})


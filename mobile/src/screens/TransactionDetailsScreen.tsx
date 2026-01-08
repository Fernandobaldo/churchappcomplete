import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { colors } from '../theme/colors'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

interface Transaction {
  id: string
  title: string
  amount: number
  type: 'ENTRY' | 'EXIT'
  category: string | null
  entryType?: 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | null
  exitType?: 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | null
  exitTypeOther?: string | null
  contributionId?: string | null
  tithePayerMemberId?: string | null
  tithePayerName?: string | null
  isTithePayerMember?: boolean | null
  createdBy?: string | null
  branchId: string
  createdAt: string
  updatedAt: string
  CreatedByUser?: {
    id: string
    name: string
    email: string
  } | null
  Contribution?: {
    id: string
    title: string
    description: string | null
  } | null
  TithePayerMember?: {
    id: string
    name: string
    email: string
  } | null
}

export default function TransactionDetailsScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransaction = useCallback(async () => {
    try {
      const response = await api.get(`/finances/${id}`)
      setTransaction(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar transação'
      Toast.show({
        type: 'error',
        text1: errorMessage,
      })
      console.error('Erro ao carregar transação:', error)
      navigation.goBack()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, navigation])

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id, fetchTransaction])

  // Recarrega quando a tela recebe foco (após editar)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchTransaction()
      }
    }, [id, fetchTransaction])
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchTransaction()
  }, [fetchTransaction])

  const getEntryTypeLabel = (type: string | null | undefined) => {
    const labels: Record<string, string> = {
      OFERTA: 'Oferta',
      DIZIMO: 'Dízimo',
      CONTRIBUICAO: 'Contribuição',
    }
    return labels[type || ''] || type
  }

  const getExitTypeLabel = (type: string | null | undefined) => {
    const labels: Record<string, string> = {
      ALUGUEL: 'Aluguel',
      ENERGIA: 'Energia',
      AGUA: 'Água',
      INTERNET: 'Internet',
      OUTROS: 'Outros',
    }
    return labels[type || ''] || type
  }

  if (loading) {
    return (
      <DetailScreenLayout
        headerProps={{
          title: "Detalhes da Transação",
          Icon: FontAwesome5,
          iconName: "dollar-sign",
        }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </DetailScreenLayout>
    )
  }

  if (!transaction) {
    return (
      <DetailScreenLayout
        headerProps={{
          title: "Detalhes da Transação",
          Icon: FontAwesome5,
          iconName: "dollar-sign",
        }}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Transação não encontrada</Text>
        </View>
      </DetailScreenLayout>
    )
  }

  return (
    <DetailScreenLayout
      headerProps={{
        title: "Detalhes da Transação",
        Icon: FontAwesome5,
        iconName: "dollar-sign",
        rightButtonIcon: (
          <Ionicons name="create-outline" size={24} color="white" />
        ),
        onRightButtonPress: () => navigation.navigate('EditTransaction' as never, { id: transaction.id } as never),
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Valor</Text>
            <Text style={[styles.amount, transaction.type === 'ENTRY' ? styles.amountEntry : styles.amountExit]}>
              {transaction.type === 'ENTRY' ? '+' : '-'}R${' '}
              {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tipo</Text>
            <View style={[styles.badge, transaction.type === 'ENTRY' ? styles.badgeEntry : styles.badgeExit]}>
              <Text style={[styles.badgeText, transaction.type === 'ENTRY' ? styles.badgeTextEntry : styles.badgeTextExit]}>
                {transaction.type === 'ENTRY' ? 'Entrada' : 'Saída'}
              </Text>
            </View>
          </View>

          {transaction.type === 'ENTRY' && transaction.entryType && (
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de Entrada</Text>
              <Text style={styles.value}>{getEntryTypeLabel(transaction.entryType)}</Text>
            </View>
          )}

          {transaction.type === 'EXIT' && transaction.exitType && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de Saída</Text>
                <Text style={styles.value}>{getExitTypeLabel(transaction.exitType)}</Text>
              </View>
              {transaction.exitType === 'OUTROS' && transaction.exitTypeOther && (
                <View style={styles.row}>
                  <Text style={styles.label}>Descrição</Text>
                  <Text style={styles.value}>{transaction.exitTypeOther}</Text>
                </View>
              )}
            </>
          )}

          {transaction.entryType === 'CONTRIBUICAO' && transaction.Contribution && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Contribuição Vinculada</Text>
                <Text style={styles.value}>{transaction.Contribution.title}</Text>
              </View>
              {transaction.Contribution.description && (
                <View style={styles.row}>
                  <Text style={styles.label}>Descrição da Contribuição</Text>
                  <Text style={styles.value}>{transaction.Contribution.description}</Text>
                </View>
              )}
            </>
          )}

          {transaction.entryType === 'DIZIMO' && (
            <>
              {transaction.isTithePayerMember && transaction.tithePayerMemberId ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Dizimista (Membro)</Text>
                  <Text style={styles.value}>
                    {transaction.TithePayerMember?.name || transaction.tithePayerMemberId}
                  </Text>
                </View>
              ) : (
                transaction.tithePayerName && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Dizimista</Text>
                    <Text style={styles.value}>{transaction.tithePayerName}</Text>
                  </View>
                )
              )}
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Data de Criação</Text>
            <Text style={styles.value}>
              {format(new Date(transaction.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Última Atualização</Text>
            <Text style={styles.value}>
              {format(new Date(transaction.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </Text>
          </View>

          {transaction.CreatedByUser && (
            <View style={styles.row}>
              <Text style={styles.label}>Criado por</Text>
              <Text style={styles.value}>{transaction.CreatedByUser.name}</Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </DetailScreenLayout>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#475569',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#64748B',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    padding: 20,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#0F172A',
  },
  subValue: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginTop: 2,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  amountEntry: {
    color: colors.status.success,
  },
  amountExit: {
    color: colors.status.error,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeEntry: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: colors.status.success,
  },
  badgeExit: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  badgeTextEntry: {
    color: colors.status.success,
  },
  badgeTextExit: {
    color: colors.status.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginVertical: 16,
  },
})



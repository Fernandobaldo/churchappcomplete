import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
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

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  const fetchTransaction = async () => {
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
    }
  }

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  if (!transaction) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Transação não encontrada</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Transação</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditTransaction' as never, { id: transaction.id } as never)}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Título</Text>
            <Text style={styles.value}>{transaction.title}</Text>
          </View>

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

          <View style={styles.row}>
            <Text style={styles.label}>Categoria</Text>
            <Text style={styles.value}>{transaction.category || 'Sem categoria'}</Text>
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
              <View>
                <Text style={styles.value}>{transaction.CreatedByUser.name}</Text>
                <Text style={styles.subValue}>{transaction.CreatedByUser.email}</Text>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  subValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  amountEntry: {
    color: '#4CAF50',
  },
  amountExit: {
    color: '#F44336',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeEntry: {
    backgroundColor: '#E8F5E9',
  },
  badgeExit: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeTextEntry: {
    color: '#2E7D32',
  },
  badgeTextExit: {
    color: '#C62828',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
})



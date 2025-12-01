import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import ModalSelector from 'react-native-modal-selector'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import MemberSearch from '../components/MemberSearch'

interface Member {
  id: string
  name: string
  email?: string
}

interface Contribution {
  id: string
  title: string
  description?: string
}

export default function EditTransactionScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY')
  const [entryType, setEntryType] = useState<'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | ''>('')
  const [exitType, setExitType] = useState<'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | ''>('')
  const [exitTypeOther, setExitTypeOther] = useState('')
  const [category, setCategory] = useState('')
  const [isTithePayerMember, setIsTithePayerMember] = useState(true)
  const [tithePayerMemberId, setTithePayerMemberId] = useState<string | null>(null)
  const [tithePayerName, setTithePayerName] = useState('')
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [contributionId, setContributionId] = useState<string | null>(null)
  const [isContributionMember, setIsContributionMember] = useState(true)
  const [contributionMemberId, setContributionMemberId] = useState<string | null>(null)
  const [contributionMemberName, setContributionMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  useEffect(() => {
    if (entryType === 'CONTRIBUICAO') {
      fetchContributions()
    }
  }, [entryType])

  const fetchTransaction = async () => {
    try {
      const response = await api.get(`/finances/${id}`)
      const transaction = response.data
      
      setTitle(transaction.title)
      setAmount(transaction.amount.toString())
      setType(transaction.type)
      setCategory(transaction.category || '')
      
      if (transaction.type === 'ENTRY') {
        setEntryType(transaction.entryType || '')
        if (transaction.entryType === 'CONTRIBUICAO') {
          setContributionId(transaction.contributionId || null)
          await fetchContributions()
        } else if (transaction.entryType === 'DIZIMO') {
          setIsTithePayerMember(transaction.isTithePayerMember ?? true)
          if (transaction.tithePayerMemberId) {
            setTithePayerMemberId(transaction.tithePayerMemberId)
          }
          if (transaction.tithePayerName) {
            setTithePayerName(transaction.tithePayerName)
          }
        }
      } else if (transaction.type === 'EXIT') {
        setExitType(transaction.exitType || '')
        if (transaction.exitType === 'OUTROS') {
          setExitTypeOther(transaction.exitTypeOther || '')
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar transação'
      Toast.show({
        type: 'error',
        text1: errorMessage,
      })
      console.error('Erro ao carregar transação:', error)
      navigation.goBack()
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchContributions = async () => {
    try {
      const response = await api.get('/contributions')
      setContributions(response.data)
    } catch (error) {
      console.error('Erro ao buscar contribuições:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar contribuições',
      })
    }
  }

  const handleSubmit = async () => {
    if (!title || !amount) {
      Alert.alert('Erro', 'Preencha título e valor')
      return
    }

    if (type === 'ENTRY' && !entryType) {
      Alert.alert('Erro', 'Selecione o tipo de entrada')
      return
    }

    if (type === 'EXIT' && !exitType) {
      Alert.alert('Erro', 'Selecione o tipo de saída')
      return
    }

    if (exitType === 'OUTROS' && !exitTypeOther.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória quando selecionar "Outros"')
      return
    }

    if (entryType === 'DIZIMO') {
      if (isTithePayerMember && !tithePayerMemberId) {
        Alert.alert('Erro', 'Selecione o membro dizimista')
        return
      }
      if (!isTithePayerMember && !tithePayerName.trim()) {
        Alert.alert('Erro', 'Digite o nome do dizimista')
        return
      }
    }

    if (entryType === 'CONTRIBUICAO' && !contributionId) {
      Alert.alert('Erro', 'Selecione uma contribuição')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        title,
        amount: parseFloat(amount),
        type,
        category: category || undefined,
      }

      if (type === 'ENTRY') {
        payload.entryType = entryType
        if (entryType === 'CONTRIBUICAO') {
          payload.contributionId = contributionId
        } else if (entryType === 'DIZIMO') {
          if (isTithePayerMember) {
            payload.tithePayerMemberId = tithePayerMemberId
            payload.isTithePayerMember = true
          } else {
            payload.tithePayerName = tithePayerName
            payload.isTithePayerMember = false
          }
        }
      } else if (type === 'EXIT') {
        payload.exitType = exitType
        if (exitType === 'OUTROS') {
          payload.exitTypeOther = exitTypeOther
        }
      }

      await api.put(`/finances/${id}`, payload)
      Toast.show({
        type: 'success',
        text1: 'Transação atualizada com sucesso!',
      })
      navigation.goBack()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar transação'
      Toast.show({
        type: 'error',
        text1: errorMessage,
      })
      console.error('Erro ao atualizar transação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (newType: 'ENTRY' | 'EXIT') => {
    setType(newType)
    if (newType === 'EXIT') {
      setEntryType('')
      setIsTithePayerMember(true)
      setTithePayerMemberId(null)
      setTithePayerName('')
      setContributionId(null)
    } else {
      setExitType('')
      setExitTypeOther('')
    }
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Pagamento de aluguel"
          />

          <Text style={styles.label}>Valor *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
          />

          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'ENTRY' && styles.typeButtonActive]}
              onPress={() => handleTypeChange('ENTRY')}
            >
              <Text style={[styles.typeButtonText, type === 'ENTRY' && styles.typeButtonTextActive]}>
                Entrada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'EXIT' && styles.typeButtonActive]}
              onPress={() => handleTypeChange('EXIT')}
            >
              <Text style={[styles.typeButtonText, type === 'EXIT' && styles.typeButtonTextActive]}>
                Saída
              </Text>
            </TouchableOpacity>
          </View>

          {type === 'ENTRY' && (
            <>
              <Text style={styles.label}>Tipo de Entrada *</Text>
              <ModalSelector
                data={[
                  { key: 'OFERTA', label: 'Ofertas' },
                  { key: 'DIZIMO', label: 'Dízimo' },
                  { key: 'CONTRIBUICAO', label: 'Contribuição' },
                ]}
                initValue={entryType === 'OFERTA' ? 'Ofertas' : entryType === 'DIZIMO' ? 'Dízimo' : entryType === 'CONTRIBUICAO' ? 'Contribuição' : 'Selecione...'}
                onChange={(option) => {
                  const newEntryType = option.key as 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO'
                  setEntryType(newEntryType)
                  if (newEntryType === 'OFERTA' || newEntryType === 'CONTRIBUICAO') {
                    setIsTithePayerMember(true)
                    setTithePayerMemberId(null)
                    setTithePayerName('')
                  }
                  if (newEntryType === 'CONTRIBUICAO') {
                    setContributionMemberId(null)
                    setContributionMemberName('')
                    setIsContributionMember(true)
                  }
                }}
              >
                <TextInput
                  style={styles.input}
                  editable={false}
                  placeholder="Selecione o tipo de entrada"
                  value={entryType === 'OFERTA' ? 'Ofertas' : entryType === 'DIZIMO' ? 'Dízimo' : entryType === 'CONTRIBUICAO' ? 'Contribuição' : ''}
                />
              </ModalSelector>

              {entryType === 'CONTRIBUICAO' && (
                <>
                  <Text style={styles.label}>Contribuição *</Text>
                  <ModalSelector
                    data={contributions.map(c => ({ key: c.id, label: c.title }))}
                    initValue={contributions.find(c => c.id === contributionId)?.title || 'Selecione uma contribuição...'}
                    onChange={(option) => setContributionId(option.key)}
                  >
                    <TextInput
                      style={styles.input}
                      editable={false}
                      placeholder="Selecione uma contribuição..."
                      value={contributions.find(c => c.id === contributionId)?.title || ''}
                    />
                  </ModalSelector>

                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>O contribuinte é membro</Text>
                    <Switch
                      value={isContributionMember}
                      onValueChange={(value) => {
                        setIsContributionMember(value)
                        if (!value) {
                          setContributionMemberId(null)
                          setContributionMemberName('')
                        } else {
                          setContributionMemberName('')
                        }
                      }}
                    />
                  </View>

                  {isContributionMember ? (
                    <>
                      <Text style={styles.label}>Contribuinte (Membro)</Text>
                      <MemberSearch
                        value={contributionMemberId || undefined}
                        onChange={(memberId) => {
                          setContributionMemberId(memberId)
                        }}
                        placeholder="Buscar membro contribuinte..."
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Nome do Contribuinte</Text>
                      <TextInput
                        style={styles.input}
                        value={contributionMemberName}
                        onChangeText={setContributionMemberName}
                        placeholder="Digite o nome do contribuinte"
                      />
                    </>
                  )}
                </>
              )}

              {entryType === 'DIZIMO' && (
                <>
                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>O dizimista é membro</Text>
                    <Switch
                      value={isTithePayerMember}
                      onValueChange={(value) => {
                        setIsTithePayerMember(value)
                        if (!value) {
                          setTithePayerMemberId(null)
                        } else {
                          setTithePayerName('')
                        }
                      }}
                    />
                  </View>

                  {isTithePayerMember ? (
                    <>
                      <Text style={styles.label}>Dizimista (Membro) *</Text>
                      <MemberSearch
                        value={tithePayerMemberId || undefined}
                        onChange={(memberId) => {
                          setTithePayerMemberId(memberId)
                        }}
                        placeholder="Buscar membro dizimista..."
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Nome do Dizimista *</Text>
                      <TextInput
                        style={styles.input}
                        value={tithePayerName}
                        onChangeText={setTithePayerName}
                        placeholder="Digite o nome do dizimista"
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

          {type === 'EXIT' && (
            <>
              <Text style={styles.label}>Tipo de Saída *</Text>
              <ModalSelector
                data={[
                  { key: 'ALUGUEL', label: 'Aluguel' },
                  { key: 'ENERGIA', label: 'Energia' },
                  { key: 'AGUA', label: 'Água' },
                  { key: 'INTERNET', label: 'Internet' },
                  { key: 'OUTROS', label: 'Outros' },
                ]}
                initValue={exitType === 'ALUGUEL' ? 'Aluguel' : exitType === 'ENERGIA' ? 'Energia' : exitType === 'AGUA' ? 'Água' : exitType === 'INTERNET' ? 'Internet' : exitType === 'OUTROS' ? 'Outros' : 'Selecione...'}
                onChange={(option) => {
                  const newExitType = option.key as 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS'
                  setExitType(newExitType)
                  if (newExitType !== 'OUTROS') {
                    setExitTypeOther('')
                  }
                }}
              >
                <TextInput
                  style={styles.input}
                  editable={false}
                  placeholder="Selecione o tipo de saída"
                  value={exitType === 'ALUGUEL' ? 'Aluguel' : exitType === 'ENERGIA' ? 'Energia' : exitType === 'AGUA' ? 'Água' : exitType === 'INTERNET' ? 'Internet' : exitType === 'OUTROS' ? 'Outros' : ''}
                />
              </ModalSelector>

              {exitType === 'OUTROS' && (
                <>
                  <Text style={styles.label}>Descrição *</Text>
                  <TextInput
                    style={styles.input}
                    value={exitTypeOther}
                    onChangeText={setExitTypeOther}
                    placeholder="Digite a descrição do tipo de saída"
                  />
                </>
              )}
            </>
          )}

          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex: Aluguel, Salário, Material, etc."
          />
          <Text style={styles.hint}>Opcional - Categoria da transação</Text>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Atualizando...' : 'Atualizar Transação'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: -12,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})


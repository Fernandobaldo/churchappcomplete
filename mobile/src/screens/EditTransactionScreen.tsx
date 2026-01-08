import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute } from '@react-navigation/native'
import ModalSelector from 'react-native-modal-selector'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import MemberSearch from '../components/MemberSearch'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

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
  
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY')
  const [entryType, setEntryType] = useState<'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | ''>('')
  const [exitType, setExitType] = useState<'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | ''>('')
  const [exitTypeOther, setExitTypeOther] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState(new Date())
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
      
      setAmount(transaction.amount.toString())
      setType(transaction.type)
      
      // Configurar data se existir
      if (transaction.date) {
        setDate(new Date(transaction.date))
      }
      
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

  // Validação: verifica se todos os campos obrigatórios estão preenchidos
  const isFormValid = useMemo(() => {
    if (!amount) return false
    
    if (type === 'ENTRY' && !entryType) return false
    if (type === 'EXIT' && !exitType) return false
    
    if (exitType === 'OUTROS' && !exitTypeOther.trim()) return false
    
    if (entryType === 'DIZIMO') {
      if (isTithePayerMember && !tithePayerMemberId) return false
      if (!isTithePayerMember && !tithePayerName.trim()) return false
    }
    
    if (entryType === 'CONTRIBUICAO' && !contributionId) return false
    
    return true
  }, [amount, type, entryType, exitType, exitTypeOther, isTithePayerMember, tithePayerMemberId, tithePayerName, contributionId])

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert('Erro', 'Preencha o valor')
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
        amount: parseFloat(amount),
        type,
      }

      if (date) {
        payload.date = date.toISOString()
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
      <FormScreenLayout
        headerProps={{
          title: "Editar Transação",
          Icon: Ionicons,
          iconName: "create-outline",
        }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </FormScreenLayout>
    )
  }

  return (
    <FormScreenLayout
      headerProps={{
        title: "Editar Transação",
        Icon: Ionicons,
        iconName: "create-outline",
      }}
    >
      <Text style={styles.label}>
        Tipo <Text style={styles.required}>*</Text>
      </Text>
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
          <Text style={styles.label}>
            Tipo de Entrada <Text style={styles.required}>*</Text>
          </Text>
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

          <TextInputField
            fieldKey="amount"
            label="Valor"
            value={amount}
            onChangeText={setAmount}
            placeholder="R$ 0,00"
            keyboardType="numeric"
            required
          />

          <Text style={styles.label}>Data</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setTempDate(date || new Date())
              setShowDatePicker(true)
            }}
          >
            <Text style={[styles.dateText, !date && styles.datePlaceholder]}>
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : 'Selecione a data (opcional)'}
            </Text>
          </TouchableOpacity>

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
                      <TextInputField
                        fieldKey="contributionMemberName"
                        label="Nome do Contribuinte"
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
                      <TextInputField
                        fieldKey="tithePayerName"
                        label="Nome do Dizimista"
                        value={tithePayerName}
                        onChangeText={setTithePayerName}
                        placeholder="Digite o nome do dizimista"
                        required
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

      {type === 'EXIT' && (
        <>
          <Text style={styles.label}>
            Tipo de Saída <Text style={styles.required}>*</Text>
          </Text>
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

          <Text style={styles.label}>
            Valor <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="R$ 0,00"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Data</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setTempDate(date || new Date())
              setShowDatePicker(true)
            }}
          >
            <Text style={[styles.dateText, !date && styles.datePlaceholder]}>
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : 'Selecione a data (opcional)'}
            </Text>
          </TouchableOpacity>

          {exitType === 'OUTROS' && (
            <>
              <TextInputField
                fieldKey="exitTypeOther"
                label="Descrição"
                value={exitTypeOther}
                onChangeText={setExitTypeOther}
                placeholder="Digite a descrição do tipo de saída"
                required
              />
            </>
          )}
        </>
      )}

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <GlassCard opacity={0.45} blurIntensity={25} borderRadius={20} style={styles.modalContent}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate)
                  }
                }}
                style={styles.datePicker}
                textColor={colors.text.primary}
                themeVariant="light"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDatePicker(false)
                  setDate(null)
                }}
              >
                <Text style={styles.modalCancelText}>Remover</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  setDate(tempDate)
                  setShowDatePicker(false)
                }}
              >
                <LinearGradient
                  colors={colors.gradients.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading || !isFormValid}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isFormValid && !loading
              ? colors.gradients.primary as [string, string]
              : ['#94A3B8', '#94A3B8'] // Cinza quando desativado
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Atualizar Transação
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </FormScreenLayout>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#e74c3c',
    fontWeight: 'bold',
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
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  datePicker: {
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalSaveButtonGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
})



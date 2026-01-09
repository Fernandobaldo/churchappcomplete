import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/auth.service'

export default function ChurchScreen() {
  const navigation = useNavigation()
  const { user, setUserFromToken } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [churchId, setChurchId] = useState<string | null>(null)
  const [structureType, setStructureType] = useState<string>('simple')

  const [formData, setFormData] = useState({
    name: '',
    address: '',
  })

  useEffect(() => {
    const loadData = async () => {
      const structure = await AsyncStorage.getItem('onboarding_structure')
      if (structure) {
        setStructureType(structure)
      }

      // Tenta carregar igreja existente
      try {
        const response = await api.get('/churches').catch(() => ({ data: [] }))
        const churches = response.data

        if (churches && Array.isArray(churches) && churches.length > 0) {
          const church = churches[0]
          setChurchId(church.id)
          setFormData({
            name: church.name || '',
            address: church.address || '',
          })
        }
      } catch (error) {
        console.log('Nenhuma igreja encontrada, criando nova...')
      }
    }

    loadData()
  }, [])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Toast.show({ type: 'error', text1: 'Nome da igreja é obrigatório' })
      return
    }

    setLoading(true)
    try {
      if (churchId) {
        // Atualiza igreja existente
        await api.put(`/churches/${churchId}`, formData)
        Toast.show({ type: 'success', text1: 'Igreja atualizada!' })
      } else {
        // Cria nova igreja
        const response = await api.post('/churches', {
          name: formData.name,
          address: formData.address || undefined,
          withBranch: structureType === 'branches',
          branchName: 'Sede',
        })
        
        // O backend retorna um novo token na resposta quando cria member
        if (response.data.token) {
          setUserFromToken(response.data.token)
        }
        
        // O backend retorna a igreja em response.data.church
        const churchId = response.data.church?.id || response.data.id
        if (churchId) {
          setChurchId(churchId)
        }
        Toast.show({ type: 'success', text1: 'Igreja criada!' })
      }

      // Navega para próxima etapa
      if (structureType === 'branches') {
        // @ts-ignore
        navigation.navigate('BranchesOnboarding')
      } else {
        // @ts-ignore
        navigation.navigate('SettingsOnboarding')
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } }
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar igreja',
        text2: apiError.response?.data?.message || 'Tente novamente',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Configure sua Igreja</Text>
          <Text style={styles.subtitle}>Preencha os dados básicos da sua igreja</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome da Igreja *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Igreja Exemplo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={styles.input}
              placeholder="Endereço completo"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Salvando...' : 'Continuar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
















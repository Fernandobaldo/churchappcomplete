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
import Toast from 'react-native-toast-message'
import api from '../../api/api'
import { Ionicons } from '@expo/vector-icons'

interface Branch {
  id?: string
  name: string
  city: string
  address: string
}

export default function BranchesScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [churchId, setChurchId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([
    { name: 'Sede', city: '', address: '' },
  ])

  useEffect(() => {
    const loadChurch = async () => {
      try {
        const response = await api.get('/churches')
        const churches = response.data
        if (churches && churches.length > 0) {
          setChurchId(churches[0].id)
          // Carrega filiais existentes
          if (churches[0].Branch && Array.isArray(churches[0].Branch)) {
            setBranches(
              churches[0].Branch.map((b: any) => ({
                id: b.id,
                name: b.name,
                city: b.city || '',
                address: b.address || '',
              }))
            )
          }
        }
      } catch (error) {
        console.error('Erro ao carregar igreja:', error)
      }
    }

    loadChurch()
  }, [])

  const addBranch = () => {
    setBranches([...branches, { name: '', city: '', address: '' }])
  }

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      setBranches(branches.filter((_, i) => i !== index))
    }
  }

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    const updated = [...branches]
    updated[index] = { ...updated[index], [field]: value }
    setBranches(updated)
  }

  const handleSubmit = async () => {
    // Validação
    for (const branch of branches) {
      if (!branch.name.trim()) {
        Toast.show({ type: 'error', text1: 'Todas as filiais precisam ter um nome' })
        return
      }
    }

    if (!churchId) {
      Toast.show({ type: 'error', text1: 'Igreja não encontrada' })
      return
    }

    setLoading(true)
    try {
      // Cria ou atualiza filiais
      for (const branch of branches) {
        if (branch.id) {
          // Atualiza filial existente
          await api.put(`/branches/${branch.id}`, {
            name: branch.name,
            city: branch.city,
            address: branch.address,
          })
        } else {
          // Cria nova filial
          await api.post('/branches', {
            name: branch.name,
            city: branch.city,
            address: branch.address,
            churchId,
          })
        }
      }

      Toast.show({ type: 'success', text1: 'Filiais salvas!' })
      // @ts-ignore
      navigation.navigate('SettingsOnboarding')
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar filiais',
        text2: error.response?.data?.message || 'Tente novamente',
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
          <Text style={styles.title}>Configure as Filiais</Text>
          <Text style={styles.subtitle}>
            Adicione as filiais da sua igreja (mínimo: Sede)
          </Text>

          <View style={styles.branchesContainer}>
            {branches.map((branch, index) => (
              <View key={index} style={styles.branchCard}>
                <View style={styles.branchHeader}>
                  <Text style={styles.branchTitle}>Filial {index + 1}</Text>
                  {branches.length > 1 && (
                    <TouchableOpacity onPress={() => removeBranch(index)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sede, Filial Centro"
                  value={branch.name}
                  onChangeText={(text) => updateBranch(index, 'name', text)}
                />

                <Text style={styles.label}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  value={branch.city}
                  onChangeText={(text) => updateBranch(index, 'city', text)}
                />

                <Text style={styles.label}>Endereço</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Endereço"
                  value={branch.address}
                  onChangeText={(text) => updateBranch(index, 'address', text)}
                  multiline
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addBranch}>
              <Ionicons name="add-circle" size={24} color="#3b82f6" />
              <Text style={styles.addButtonText}>Adicionar Filial</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Salvando...' : 'Finalizar'}
            </Text>
          </TouchableOpacity>
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
  branchesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  branchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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













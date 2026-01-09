import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import api from '../../api/api'
import { useAuthStore } from '../../stores/authStore'
import Toast from 'react-native-toast-message'
import { resetToLogin } from '../../navigation/navigationRef'

type StructureType = 'simple' | 'branches' | 'existing' | null

export default function StartScreen() {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [selectedStructure, setSelectedStructure] = useState<StructureType>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingState = async () => {
      try {
        const response = await api.get('/onboarding/state')
        const state = response.data

        if (state.status === 'COMPLETE') {
          // Onboarding completo, redirecionar para Main
          // O AppNavigator já gerencia isso, mas podemos forçar navegação
          return
        } else if (state.status === 'PENDING') {
          // Onboarding pendente, preencher dados e continuar
          if (state.church) {
            // Salvar dados da igreja para prefill
            await AsyncStorage.setItem('onboarding_church_id', state.church.id)
            await AsyncStorage.setItem('onboarding_church_name', state.church.name || '')
            await AsyncStorage.setItem('onboarding_church_address', state.church.address || '')
          }
          
          if (state.branch) {
            // Se tem branch, pode ser estrutura com filiais
            await AsyncStorage.setItem('onboarding_structure', 'branches')
            setSelectedStructure('branches')
          } else {
            // Se não tem branch, pode ser estrutura simples
            await AsyncStorage.setItem('onboarding_structure', 'simple')
            setSelectedStructure('simple')
          }
        }
        // Se status é NEW, deixa o usuário escolher normalmente
      } catch (error: any) {
        console.error('Erro ao verificar estado de onboarding:', error)
        // Em caso de erro, continua normalmente
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingState()
  }, [])

  const handleLogout = () => {
    resetToLogin()
  }

  const handleContinue = async () => {
    if (!selectedStructure) {
      return
    }

    if (selectedStructure === 'simple' || selectedStructure === 'branches') {
      // Salva a escolha no AsyncStorage
      await AsyncStorage.setItem('onboarding_structure', selectedStructure)
      // @ts-ignore
      navigation.navigate('ChurchOnboarding')
    } else if (selectedStructure === 'existing') {
      // Por enquanto, apenas mostra mensagem
      alert('Funcionalidade de entrar em igreja existente será implementada em breve.')
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#666" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Escolha a estrutura da sua igreja</Text>
        <Text style={styles.subtitle}>
          Selecione a opção que melhor descreve a estrutura da sua igreja
        </Text>

        <View style={styles.optionsContainer}>
          {/* Opção 1: Estrutura Simples */}
          <TouchableOpacity
            style={[
              styles.option,
              selectedStructure === 'simple' && styles.optionSelected,
            ]}
            onPress={() => setSelectedStructure('simple')}
          >
            <Ionicons
              name="business-outline"
              size={32}
              color={selectedStructure === 'simple' ? '#3b82f6' : '#666'}
            />
            <Text style={styles.optionTitle}>Estrutura Simples</Text>
            <Text style={styles.optionDescription}>
              Uma única igreja sem filiais
            </Text>
          </TouchableOpacity>

          {/* Opção 2: Com Filiais */}
          <TouchableOpacity
            style={[
              styles.option,
              selectedStructure === 'branches' && styles.optionSelected,
            ]}
            onPress={() => setSelectedStructure('branches')}
          >
            <Ionicons
              name="business"
              size={32}
              color={selectedStructure === 'branches' ? '#3b82f6' : '#666'}
            />
            <Text style={styles.optionTitle}>Com Filiais</Text>
            <Text style={styles.optionDescription}>
              Igreja principal com múltiplas filiais
            </Text>
          </TouchableOpacity>

          {/* Opção 3: Entrar em Igreja Existente */}
          <TouchableOpacity
            style={[
              styles.option,
              selectedStructure === 'existing' && styles.optionSelected,
            ]}
            onPress={() => setSelectedStructure('existing')}
          >
            <Ionicons
              name="people"
              size={32}
              color={selectedStructure === 'existing' ? '#3b82f6' : '#666'}
            />
            <Text style={styles.optionTitle}>Entrar em Igreja Existente</Text>
            <Text style={styles.optionDescription}>
              Já tenho um convite para uma igreja
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !selectedStructure && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedStructure}
        >
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
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
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  logoutText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
})
















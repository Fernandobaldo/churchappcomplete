import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/api'
import Toast from 'react-native-toast-message'

export default function ConcluidoScreen() {
  const navigation = useNavigation()
  const { user, setUserFromToken } = useAuthStore()

  const handleGoToDashboard = async () => {
    try {
      // Marcar onboarding como completo
      const response = await api.post('/onboarding/complete')
      
      // Se o backend retornar um token atualizado, atualizar o store
      if (response.data.token) {
        setUserFromToken(response.data.token)
      } else {
        // Se não retornar token, fazer login novamente para obter token atualizado
        // O AppNavigator detectará automaticamente quando onboardingCompleted for true
        Toast.show({
          type: 'success',
          text1: 'Onboarding concluído!',
          text2: 'Redirecionando para o painel...',
        })
      }
    } catch (error: any) {
      console.error('Erro ao marcar onboarding como completo:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao concluir onboarding',
        text2: 'Tente novamente mais tarde',
      })
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>

        <Text style={styles.title}>Configuração inicial concluída!</Text>
        <Text style={styles.subtitle}>
          Parabéns! Agora você já pode começar a gerenciar membros, eventos e contribuições da sua
          igreja.
        </Text>
        <Text style={styles.description}>
          Você pode atualizar essas configurações a qualquer momento nas configurações do sistema.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToDashboard}
        >
          <Text style={styles.buttonText}>Ir para o painel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})


















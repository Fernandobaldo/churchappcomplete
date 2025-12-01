import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import api, { setToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'

export default function LoginScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUserFromToken } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos.' })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('auth/login', { email, password })
      
      // Extrai os dados da resposta
      const { token, user } = response.data
      
      if (!token) {
        Toast.show({ type: 'error', text1: 'Erro ao fazer login', text2: 'Token não recebido.' })
        return
      }

      // Salva o token no axios
      setToken(token)
      
      // Salva o token e dados do usuário no store
      setUserFromToken(token)
      
      // Aguarda um pouco para o store atualizar
      setTimeout(() => {
        // Verifica se precisa completar onboarding (sem branchId ou role)
        const userData = useAuthStore.getState().user
        if (!userData?.branchId || !userData?.role) {
          Toast.show({ type: 'info', text1: 'Complete a configuração inicial' })
          navigation.navigate('StartOnboarding' as never)
        } else {
          Toast.show({ type: 'success', text1: 'Login realizado!' })
          navigation.navigate('Main' as never)
        }
      }, 100)
    } catch (error: any) {
      console.error('Erro no login:', error)
      
      // Tratamento melhorado de erros
      let errorMessage = 'Verifique seus dados.'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tempo de conexão esgotado. Verifique sua conexão.'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de rede. Verifique se o servidor está rodando.'
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro ao fazer login',
        text2: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="exemplo@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text style={styles.linkText}>
              Não tem uma conta? <Text style={styles.linkTextBold}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  inner: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#333',
  },
})

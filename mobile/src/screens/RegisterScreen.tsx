import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import api, { setToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'

export default function RegisterScreen() {
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUserFromToken } = useAuthStore()

  // Validação: verifica se todos os campos obrigatórios estão preenchidos
  const isFormValid = useMemo(() => {
    if (!name || !email || !password) return false
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return false
    
    // Validação de senha
    if (password.length < 6) return false
    
    return true
  }, [name, email, password])

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos.' })
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Toast.show({ type: 'error', text1: 'Email inválido.' })
      return
    }

    // Validação de senha
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Senha deve ter no mínimo 6 caracteres.' })
      return
    }

    setLoading(true)
    try {
      let response

      // Tenta primeiro o endpoint /register (registro público)
      try {
        response = await api.post('/register', {
          name,
          email,
          password,
          fromLandingPage: true,
        })

        const { token } = response.data

        if (!token) {
          throw new Error('Token não recebido do servidor')
        }

        // Salva o token no axios
        setToken(token)

        // Salva o token e dados do usuário no store
        setUserFromToken(token)

        Toast.show({
          type: 'success',
          text1: 'Conta criada com sucesso!',
        })

        // O AppNavigator detecta automaticamente a mudança de estado
        // e renderiza o navigator de onboarding quando isAuthenticated=true e hasCompleteMember=false
        // Não é necessário fazer reset manual aqui
        return
      } catch (firstError: any) {
        // Verificar se é erro de email já cadastrado - não tentar endpoint alternativo
        if (
          firstError.response?.status === 400 &&
          (firstError.response?.data?.error?.includes('já cadastrado') ||
           firstError.response?.data?.message?.includes('já cadastrado') ||
           firstError.response?.data?.error?.includes('Email já cadastrado'))
        ) {
          // Email já cadastrado, não tenta endpoint alternativo
          throw firstError
        }
        
        // Se falhar, tenta o endpoint /public/register (apenas para 404 ou 401)
        if (
          firstError.response?.status === 404 ||
          firstError.response?.status === 401
        ) {
          console.log('Endpoint /register não disponível, usando alternativa...')

          // Registra o usuário primeiro
          const registerResponse = await api.post('/public/register', {
            name,
            email,
            password,
          })

          const { token } = registerResponse.data

          if (!token) {
            throw new Error('Token não recebido do servidor')
          }

          // Salva o token no axios
          setToken(token)

          // Salva o token e dados do usuário no store
          setUserFromToken(token)

          Toast.show({
            type: 'success',
            text1: 'Conta criada com sucesso!',
          })

          // O AppNavigator detecta automaticamente a mudança de estado
          // e renderiza o navigator de onboarding quando isAuthenticated=true e hasCompleteMember=false
          // Não é necessário fazer reset manual aqui
          return
        }
        throw firstError
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)

      // Verificar se é erro de email já cadastrado
      if (
        error.response?.status === 400 &&
        (error.response?.data?.error?.includes('já cadastrado') ||
         error.response?.data?.message?.includes('já cadastrado') ||
         error.response?.data?.error?.includes('Email já cadastrado'))
      ) {
        Toast.show({
          type: 'error',
          text1: 'Email já cadastrado',
          text2: 'Tente fazer login ou use outro email.',
        })
      } else if (
        error.response?.status === 409 ||
        error.response?.data?.message?.includes('já está em uso') ||
        error.response?.data?.message?.includes('já cadastrado')
      ) {
        Toast.show({
          type: 'error',
          text1: 'Email já cadastrado',
          text2: 'Tente fazer login ou use outro email.',
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao criar conta',
          text2:
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Verifique os dados e tente novamente.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>ChurchPulse</Text>
            <Text style={styles.subtitle}>Crie sua conta para começar</Text>

            <View style={styles.form}>
              <TextInputField
                fieldKey="name"
                label="Nome completo"
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                required
                autoCapitalize="words"
              />

              <TextInputField
                fieldKey="email"
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="exemplo@email.com"
                required
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInputField
                fieldKey="password"
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                required
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
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
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Criando conta...' : 'Criar conta e continuar'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.linkText}>
                  Já tem uma conta? <Text style={styles.linkTextBold}>Fazer login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
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
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
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
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
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


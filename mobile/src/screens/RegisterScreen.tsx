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
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import api, { setToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'

export default function RegisterScreen() {
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [churchName, setChurchName] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUserFromToken } = useAuthStore()

  const handleRegister = async () => {
    if (!name || !email || !password || !churchName) {
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

        // Tenta criar a igreja com filial
        try {
          await api.post('/churches', {
            name: churchName,
            withBranch: true,
            branchName: 'Sede',
          })
          Toast.show({
            type: 'success',
            text1: 'Conta e igreja criadas com sucesso!',
          })
        } catch (churchError: any) {
          // Se não conseguir criar a igreja, continua mesmo assim
          console.warn('Não foi possível criar a igreja automaticamente:', churchError)
          Toast.show({
            type: 'success',
            text1: 'Conta criada!',
            text2: 'Complete a configuração da igreja no próximo passo.',
          })
        }

        // Verifica se precisa completar onboarding
        const userData = useAuthStore.getState().user
        if (!userData?.branchId || !userData?.role) {
          // @ts-ignore
          navigation.replace('StartOnboarding')
        } else {
          // @ts-ignore
          navigation.replace('Dashboard')
        }
        return
      } catch (firstError: any) {
        // Se falhar, tenta o endpoint /public/register
        if (
          firstError.response?.status === 400 ||
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

          // Tenta criar a igreja com filial
          try {
            await api.post('/churches', {
              name: churchName,
              withBranch: true,
              branchName: 'Sede',
            })
            Toast.show({
              type: 'success',
              text1: 'Conta e igreja criadas com sucesso!',
            })
          } catch (churchError: any) {
            console.warn('Não foi possível criar a igreja automaticamente:', churchError)
            Toast.show({
              type: 'success',
              text1: 'Conta criada!',
              text2: 'Complete a configuração da igreja no próximo passo.',
            })
          }

          // Navega para o dashboard
          // @ts-ignore
          navigation.replace('Dashboard')
          return
        }
        throw firstError
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)

      if (
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
              <Text style={styles.label}>Nome completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Senha *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.label}>Nome da igreja *</Text>
              <TextInput
                style={styles.input}
                placeholder="Igreja Exemplo"
                value={churchName}
                onChangeText={setChurchName}
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Criando conta...' : 'Criar conta e continuar'}
                </Text>
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
    backgroundColor: '#333',
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


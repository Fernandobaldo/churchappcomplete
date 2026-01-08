import React, { useState, useEffect } from 'react'
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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import api, { setToken } from '../api/api'
import { useAuthStore } from '../stores/authStore'
import GlassBackground from '../components/GlassBackground'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

export default function LoginScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUserFromToken, token, user } = useAuthStore()

  // Previne navegação de volta para Login quando o usuário está autenticado
  useEffect(() => {
    // Se o usuário já está autenticado, redireciona para Main imediatamente
    if (token && user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      })
      return
    }

    // Previne navegação de volta para Login quando o usuário está autenticado
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (token && user) {
        e.preventDefault()
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        })
      }
    })

    return unsubscribe
  }, [navigation, token, user])

  // Verifica se os campos estão preenchidos
  const isFormValid = email.trim().length > 0 && password.trim().length > 0
  
  // Gradiente mais forte quando o botão está ativo
  const activeGradient = ['#6366F1', '#4F46E5'] // Indigo mais forte
  const inactiveGradient = colors.gradients.primary

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
    <GlassBackground
      overlayOpacity={0.3}
      blurIntensity={25}
      gradientColors={colors.gradients.primary}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inner}>
              <View style={styles.loginCardWrapper}>
                <GlassCard
                  opacity={0.45}
                  blurIntensity={25}
                  borderRadius={28}
                  style={styles.loginCard}
                  shadowVariant="heavy"
                >
                  <Text style={styles.title}>Bem-vindo! 👋</Text>
                  <Text style={styles.subtitle}>Entre na sua conta</Text>

                  <View style={styles.inputContainer}>
                    <TextInputField
                      fieldKey="email"
                      label=""
                      value={email}
                      onChangeText={setEmail}
                      placeholder="exemplo@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInputField
                      fieldKey="password"
                      label=""
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleLogin}
                  disabled={loading || !isFormValid}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isFormValid ? (activeGradient as [string, string]) : (inactiveGradient as [string, string])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradientButton, !isFormValid && styles.gradientButtonDisabled]}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => navigation.navigate('Register' as never)}
                >
                  <Text style={styles.linkText}>
                    Não tem uma conta? <Text style={styles.linkTextBold}>Criar conta</Text>
                  </Text>
                </TouchableOpacity>
                </GlassCard>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GlassBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  inner: {
    width: '100%',
    alignItems: 'center',
  },
  loginCardWrapper: {
    width: '100%',
    maxWidth: 400,
    zIndex: 100,
    elevation: 10,
  },
  loginCard: {
    width: '100%',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 38,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    borderRadius: 18,
    marginTop: 8,
    overflow: 'hidden',
    minHeight: 56,
    ...colors.shadow.glassLight,
  },
  gradientButton: {
    width: '100%',
    height: 56,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
  },
  linkTextBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.gradients.primary[1],
  },
})

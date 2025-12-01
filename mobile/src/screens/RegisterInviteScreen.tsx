import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import api from '../api/api'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import FormsComponent from '../components/FormsComponent'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

interface InviteLinkInfo {
  id: string
  branchName: string
  churchName: string
  expiresAt: string | null
  maxUses: number | null
  currentUses: number
  isActive: boolean
}

export default function RegisterInviteScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { setUserFromToken } = useAuthStore()
  const token = (route.params as any)?.token
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [linkInfo, setLinkInfo] = useState<InviteLinkInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    birthDate: '',
    avatarUrl: '',
  })

  const fields = [
    { key: 'name', label: 'Nome completo *', type: 'string' },
    { key: 'email', label: 'E-mail *', type: 'email', placeholder: 'exemplo@email.com' },
    { key: 'password', label: 'Senha *', type: 'password' },
    { key: 'phone', label: 'Telefone', type: 'string' },
    { key: 'birthDate', label: 'Data de nascimento', type: 'date' },
    { key: 'address', label: 'Endereço', type: 'string' },
    { key: 'avatarUrl', label: 'Foto de Perfil', type: 'image' },
  ]

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError('Token de convite não fornecido')
      setValidating(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await api.get(`/invite-links/${token}/info`)
      setLinkInfo(response.data)

      if (!response.data.isActive) {
        setError('Este link de convite foi desativado')
        setValidating(false)
        return
      }

      if (response.data.expiresAt && new Date(response.data.expiresAt) < new Date()) {
        setError('Este link de convite expirou')
        setValidating(false)
        return
      }

      if (
        response.data.maxUses !== null &&
        response.data.currentUses >= response.data.maxUses
      ) {
        setError('Este link de convite atingiu o limite de usos')
        setValidating(false)
        return
      }

      setValidating(false)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Link de convite não encontrado')
      } else {
        setError('Erro ao validar link de convite')
      }
      setValidating(false)
    }
  }

  const handleRegister = async () => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Token de convite não fornecido',
      })
      return
    }

    if (!form.name || !form.email || !form.password) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha todos os campos obrigatórios',
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/public/register/invite', {
        ...form,
        inviteToken: token,
      })

      const { token: authToken, member } = response.data

      if (!authToken) {
        throw new Error('Token não recebido do servidor')
      }

      setUserFromToken(authToken)
      Toast.show({
        type: 'success',
        text1: 'Sucesso!',
        text2: 'Registro realizado com sucesso! Bem-vindo(a)!',
      })

      navigation.navigate('Main' as never)
    } catch (error: any) {
      console.error('Erro ao registrar:', error)

      if (error.response?.data?.error === 'LIMIT_REACHED') {
        navigation.navigate('MemberLimitReached' as never, { token } as never)
        return
      }

      if (error.response?.status === 403 && error.response?.data?.error === 'LIMIT_REACHED') {
        navigation.navigate('MemberLimitReached' as never, { token } as never)
        return
      }

      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Não foi possível completar o registro. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Validando link de convite...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Erro"
          Icon={FontAwesome5}
          iconName="exclamation-triangle"
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.buttonText}>Ir para Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <PageHeader
        title="Registro de Membro"
        Icon={FontAwesome5}
        iconName="user-plus"
      />
      <ScrollView style={styles.scrollView}>
        {linkInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Bem-vindo(a)!</Text>
            <Text style={styles.infoText}>
              Igreja: <Text style={styles.infoBold}>{linkInfo.churchName}</Text>
            </Text>
            <Text style={styles.infoText}>
              Filial: <Text style={styles.infoBold}>{linkInfo.branchName}</Text>
            </Text>
          </View>
        )}

        <FormsComponent
          form={form}
          setForm={setForm}
          fields={fields}
          onSubmit={handleRegister}
          submitLabel={loading ? 'Registrando...' : 'Completar Registro'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoBold: {
    fontWeight: '600',
    color: '#111827',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})




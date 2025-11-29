import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import api from '../api/api'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

interface InviteLinkInfo {
  branchName: string
  churchName: string
}

export default function MemberLimitReachedScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const token = (route.params as any)?.token
  const [linkInfo, setLinkInfo] = useState<InviteLinkInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchLinkInfo()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchLinkInfo = async () => {
    try {
      const response = await api.get(`/invite-links/${token}/info`)
      setLinkInfo(response.data)
    } catch (error) {
      console.error('Erro ao buscar informações do link:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Limite Atingido"
        Icon={FontAwesome5}
        iconName="exclamation-triangle"
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="exclamation-triangle" size={64} color="#EF4444" />
        </View>

        <Text style={styles.title}>Limite de Membros Atingido</Text>

        {linkInfo && (
          <Text style={styles.text}>
            O limite de membros permitido para o plano da igreja{' '}
            <Text style={styles.bold}>{linkInfo.churchName}</Text> foi atingido.
          </Text>
        )}

        <Text style={styles.text}>
          Não é possível realizar novos registros no momento. Por favor, entre em contato com o
          administrador responsável para mais informações.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.buttonText}>Ir para Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#374151',
  },
})




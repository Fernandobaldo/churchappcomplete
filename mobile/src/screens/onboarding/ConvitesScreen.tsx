import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

export default function ConvitesScreen() {
  const navigation = useNavigation()
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const emailList = emails
        .split('\n')
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      if (emailList.length > 0) {
        // Validação básica de emails
        const invalidEmails = emailList.filter(
          (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )

        if (invalidEmails.length > 0) {
          Toast.show({
            type: 'error',
            text1: 'Alguns emails são inválidos. Verifique e tente novamente.',
          })
          setLoading(false)
          return
        }

        // TODO: Chamar endpoint de convites quando disponível
        // await api.post('/invites', { emails: emailList })
        
        Toast.show({
          type: 'success',
          text1: `${emailList.length} convite(s) enviado(s) com sucesso!`,
        })
      }

      navigation.navigate('ConcluidoOnboarding' as never)
    } catch (error: any) {
      console.error('Erro ao enviar convites:', error)
      Toast.show({
        type: 'error',
        text1: 'Não foi possível enviar os convites. Você pode fazer isso depois.',
      })
      navigation.navigate('ConcluidoOnboarding' as never)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigation.navigate('ConcluidoOnboarding' as never)
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Convite de Membros</Text>
          <Text style={styles.description}>
            Você pode convidar sua equipe agora ou pular esta etapa e fazer isso depois.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Emails para convite (um por linha)</Text>
            <TextInput
              style={styles.textArea}
              value={emails}
              onChangeText={setEmails}
              placeholder="admin@igreja.com&#10;pastor@igreja.com&#10;secretario@igreja.com"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              Opcional - Digite um email por linha. Você pode convidar membros depois também.
            </Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSkip}
              >
                <Text style={styles.buttonSecondaryText}>Pular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Enviar convites e continuar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: -8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4F46E5',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
})



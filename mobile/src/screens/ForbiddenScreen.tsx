import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

export default function ForbiddenScreen() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-x" size={64} color="#EF4444" />
        </View>
        
        <Text style={styles.title}>403</Text>
        <Text style={styles.subtitle}>Acesso Negado</Text>
        <Text style={styles.description}>
          Você não tem permissão para acessar esta página.
          Entre em contato com o administrador se precisar de acesso.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Main' as never)}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Voltar ao Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})


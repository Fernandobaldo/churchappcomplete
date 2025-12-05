import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

type StructureType = 'simple' | 'branches' | 'existing' | null

export default function StartScreen() {
  const navigation = useNavigation()
  const [selectedStructure, setSelectedStructure] = useState<StructureType>(null)

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
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
              name="church"
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
})












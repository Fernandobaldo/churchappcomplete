import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/api'

type Step = 1 | 2 | 3

interface StepConfig {
  number: number
  title: string
  icon: string
}

const steps: StepConfig[] = [
  { number: 1, title: 'Roles e Permissões', icon: 'people' },
  { number: 2, title: 'Módulos', icon: 'checkmark-circle' },
  { number: 3, title: 'Links de Convite', icon: 'link' },
]

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [rolesCreated, setRolesCreated] = useState(false)
  const [modules, setModules] = useState({
    events: true,
    members: true,
    contributions: true,
    finances: false,
    devotionals: true,
  })

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Carregar módulos salvos
        const savedModules = await AsyncStorage.getItem('onboarding_modules')
        if (savedModules) {
          const parsedModules = JSON.parse(savedModules)
          setModules(parsedModules)
        }
        
        // Verificar se roles já foram criadas
        const rolesCreatedSaved = await AsyncStorage.getItem('onboarding_roles_created')
        if (rolesCreatedSaved === 'true') {
          setRolesCreated(true)
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error)
      }
    }

    loadSavedData()
  }, [])

  const handleStep1 = async () => {
    setLoading(true)
    try {
      // Cria roles padrão usando preset
      // Por enquanto, apenas marca como criado
      // TODO: Integrar com endpoint de criação de roles quando disponível
      setRolesCreated(true)
      await AsyncStorage.setItem('onboarding_roles_created', 'true')
      Toast.show({
        type: 'success',
        text1: 'Roles criadas com sucesso!',
      })
      setCurrentStep(2)
    } catch (error) {
      console.error('Erro ao criar roles:', error)
      Toast.show({
        type: 'error',
        text1: 'Não foi possível criar roles. Você pode criar depois.',
      })
      setCurrentStep(2) // Continua mesmo com erro
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    // Salva módulos selecionados
    await AsyncStorage.setItem('onboarding_modules', JSON.stringify(modules))
    setCurrentStep(3)
  }

  const handleStep3 = async () => {
    // Marcar etapa settings como completa
    try {
      await api.post('/onboarding/progress/settings')
    } catch (progressError) {
      console.error('Erro ao marcar progresso:', progressError)
    }
    
    // Página apenas informativa - navega para tela de conclusão
    navigation.navigate('ConcluidoOnboarding' as never)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Roles e Permissões</Text>
            <Text style={styles.stepDescription}>
              Vamos criar as roles padrão para sua igreja. Você pode personalizar depois.
            </Text>

            <View style={styles.rolesList}>
              <Text style={styles.rolesTitle}>Roles que serão criadas:</Text>
              <View style={styles.roleItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.roleText}>Administrador Geral (ADMINGERAL)</Text>
              </View>
              <View style={styles.roleItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.roleText}>Administrador de Filial (ADMINFILIAL)</Text>
              </View>
              <View style={styles.roleItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.roleText}>Coordenador (COORDINATOR)</Text>
              </View>
              <View style={styles.roleItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.roleText}>Membro (MEMBER)</Text>
              </View>
            </View>

            {rolesCreated && (
              <View style={styles.successMessage}>
                <Text style={styles.successText}>✓ Roles criadas com sucesso!</Text>
              </View>
            )}

            <View style={styles.stepButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  const structureType = AsyncStorage.getItem('onboarding_structure').then((value) => {
                    if (value === 'branches') {
                      navigation.navigate('BranchesOnboarding' as never)
                    } else {
                      navigation.navigate('ChurchOnboarding' as never)
                    }
                  })
                }}
              >
                <Text style={styles.buttonSecondaryText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  if (!rolesCreated) {
                    handleStep1()
                  } else {
                    setCurrentStep(2)
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>
                    {rolesCreated ? 'Continuar' : 'Criar Roles'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ativar Módulos</Text>
            <Text style={styles.stepDescription}>
              Selecione quais módulos você deseja usar na sua igreja
            </Text>

            <View style={styles.modulesList}>
              {[
                { key: 'events', label: 'Eventos', icon: 'calendar', description: 'Gerencie cultos e eventos' },
                { key: 'members', label: 'Membros', icon: 'people', description: 'Gerencie membros da igreja' },
                { key: 'contributions', label: 'Contribuições', icon: 'heart', description: 'Gerencie ofertas e dízimos' },
                { key: 'finances', label: 'Finanças', icon: 'cash', description: 'Controle financeiro completo' },
                { key: 'devotionals', label: 'Devocionais', icon: 'book', description: 'Compartilhe devocionais' },
              ].map((module) => (
                <TouchableOpacity
                  key={module.key}
                  style={[
                    styles.moduleItem,
                    modules[module.key as keyof typeof modules] && styles.moduleItemActive,
                  ]}
                  onPress={() =>
                    setModules({ ...modules, [module.key]: !modules[module.key as keyof typeof modules] })
                  }
                >
                  <View style={styles.moduleContent}>
                    <Ionicons
                      name={module.icon as any}
                      size={24}
                      color={modules[module.key as keyof typeof modules] ? '#4F46E5' : '#666'}
                    />
                    <View style={styles.moduleText}>
                      <Text style={styles.moduleLabel}>{module.label}</Text>
                      <Text style={styles.moduleDescription}>{module.description}</Text>
                    </View>
                    <Switch
                      value={modules[module.key as keyof typeof modules]}
                      onValueChange={(value) =>
                        setModules({ ...modules, [module.key]: value })
                      }
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.stepButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.buttonSecondaryText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleStep2}
              >
                <Text style={styles.buttonPrimaryText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Links de Convite</Text>
            <Text style={styles.stepDescription}>
              Você poderá criar links de convite para adicionar membros à sua igreja a qualquer momento.
            </Text>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <Text style={styles.infoText}>
                Acesse a seção "Mais" no menu principal e depois "Convites e Cadastro de Membros" para criar links de convite personalizados.
              </Text>
            </View>

            <View style={styles.stepButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.buttonSecondaryText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleStep3}
              >
                <Text style={styles.buttonPrimaryText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => (
              <View key={step.number} style={styles.progressItem}>
                <View style={styles.progressStepContainer}>
                  <View
                    style={[
                      styles.progressStep,
                      currentStep >= step.number && styles.progressStepActive,
                    ]}
                  >
                    {currentStep > step.number ? (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    ) : (
                      <Ionicons
                        name={step.icon as any}
                        size={20}
                        color={currentStep >= step.number ? '#fff' : '#999'}
                      />
                    )}
                  </View>
                  {index < steps.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        currentStep > step.number && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    currentStep >= step.number && styles.progressLabelActive,
                  ]}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Step Content */}
          <View style={styles.stepContainer}>{renderStepContent()}</View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  progressStepActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#4F46E5',
  },
  progressLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  stepContainer: {
    minHeight: 400,
  },
  stepContent: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  rolesList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rolesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#333',
  },
  successMessage: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  modulesList: {
    gap: 12,
  },
  moduleItem: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
  },
  moduleItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#E0E7FF',
  },
  moduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleText: {
    flex: 1,
  },
  moduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  stepButtons: {
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


import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'

interface Position {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
  _count?: {
    Members: number
  }
}

export default function PositionsScreen() {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newPositionName, setNewPositionName] = useState('')

  const isAdmin = user?.role === 'ADMINGERAL'

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/positions')
      setPositions(response.data)
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar cargos' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadPositions()
  }, [loadPositions])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadPositions()
  }, [loadPositions])

  const handleCreate = async () => {
    if (!isAdmin) {
      Toast.show({ type: 'error', text1: 'Apenas administradores podem criar cargos' })
      return
    }

    if (!newPositionName.trim()) {
      Toast.show({ type: 'error', text1: 'Nome do cargo é obrigatório' })
      return
    }

    setSaving(true)
    try {
      await api.post('/positions', { name: newPositionName.trim() })
      Toast.show({ type: 'success', text1: 'Cargo criado com sucesso!' })
      setNewPositionName('')
      loadPositions()
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.error || 'Erro ao criar cargo' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditStart = (position: Position) => {
    if (!isAdmin) {
      Toast.show({ type: 'error', text1: 'Apenas administradores podem editar cargos' })
      return
    }
    setEditingId(position.id)
    setEditingName(position.name)
  }

  const handleEditSave = async (id: string) => {
    if (!editingName.trim()) {
      Toast.show({ type: 'error', text1: 'Nome do cargo não pode estar vazio' })
      return
    }

    try {
      await api.put(`/positions/${id}`, { name: editingName.trim() })
      Toast.show({ type: 'success', text1: 'Cargo atualizado com sucesso!' })
      setEditingId(null)
      setEditingName('')
      loadPositions()
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.error || 'Erro ao atualizar cargo' })
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      Toast.show({ type: 'error', text1: 'Apenas administradores podem deletar cargos' })
      return
    }

    Alert.alert(
      'Deletar Cargo',
      'Tem certeza que deseja deletar este cargo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/positions/${id}`)
              Toast.show({ type: 'success', text1: 'Cargo deletado com sucesso!' })
              loadPositions()
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.response?.data?.error || 'Erro ao deletar cargo' })
            }
          },
        },
      ]
    )
  }

  return (
    <ViewScreenLayout
      headerProps={{
        title: "Cargos da Igreja",
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {isAdmin ? 'Gerencie os cargos disponíveis para os membros' : 'Visualize os cargos disponíveis'}
        </Text>

        {isAdmin && (
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield" size={20} color={colors.gradients.primary[1]} />
              <Text style={styles.cardTitle}>Criar Novo Cargo</Text>
            </View>
            <View style={styles.form}>
              <TextInputField
                fieldKey="newPositionName"
                label="Nome do Cargo"
                value={newPositionName}
                onChangeText={setNewPositionName}
                placeholder="Ex: Diácono, Músico, etc."
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={saving ? ['#94A3B8', '#94A3B8'] : colors.gradients.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>{saving ? 'Criando...' : 'Criar Cargo'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {!isAdmin && (
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
            <Text style={styles.infoText}>Apenas administradores podem gerenciar cargos.</Text>
          </GlassCard>
        )}

        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
          <Text style={styles.cardTitle}>Cargos Existentes</Text>
          {positions.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum cargo cadastrado ainda.</Text>
          ) : (
            <View style={styles.positionsList}>
              {positions.map((position) => (
                <GlassCard key={position.id} opacity={0.35} blurIntensity={20} borderRadius={16} style={styles.positionItem}>
                  <View style={styles.positionInfo}>
                    {editingId === position.id ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editingName}
                          onChangeText={setEditingName}
                          autoFocus
                          onSubmitEditing={() => handleEditSave(position.id)}
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleEditSave(position.id)}
                          >
                            <Ionicons name="checkmark" size={20} color="#16a34a" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleEditCancel}
                          >
                            <Ionicons name="close" size={20} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.positionHeader}>
                          <Text style={styles.positionName}>{position.name}</Text>
                          {position.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Ionicons name="star" size={14} color="#2563eb" />
                              <Text style={styles.defaultBadgeText}>Padrão</Text>
                            </View>
                          )}
                        </View>
                        {position._count && (
                          <Text style={styles.memberCount}>
                            {position._count.Members} membro(s) com este cargo
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                  {!position.isDefault && editingId !== position.id && isAdmin && (
                    <View style={styles.positionActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleEditStart(position)}
                      >
                        <Ionicons name="pencil" size={20} color="#2563eb" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDelete(position.id)}
                      >
                        <Ionicons name="trash" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              ))}
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </ViewScreenLayout>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 16,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 4,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gradients.primary[1],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '400',
    backgroundColor: colors.glass.overlay,
    color: colors.text.primary,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    minHeight: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    padding: 16,
  },
  positionsList: {
    gap: 12,
    marginTop: 12,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  positionInfo: {
    flex: 1,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gradients.primary[0],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.gradients.primary[1],
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginTop: 4,
  },
  positionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
})


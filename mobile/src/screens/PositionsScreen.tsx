import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import PageHeader from '../components/PageHeader'

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
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newPositionName, setNewPositionName] = useState('')

  const isAdmin = user?.role === 'ADMINGERAL'

  useEffect(() => {
    loadPositions()
  }, [])

  const loadPositions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/positions')
      setPositions(response.data)
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar cargos' })
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Cargos da Igreja" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3366FF" />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Cargos da Igreja" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          {isAdmin ? 'Gerencie os cargos disponíveis para os membros' : 'Visualize os cargos disponíveis'}
        </Text>

        {isAdmin && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield" size={20} color="#3366FF" />
              <Text style={styles.cardTitle}>Criar Novo Cargo</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.label}>Nome do Cargo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Diácono, Músico, etc."
                value={newPositionName}
                onChangeText={setNewPositionName}
                onSubmitEditing={handleCreate}
              />
              <TouchableOpacity
                style={[styles.button, saving && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>{saving ? 'Criando...' : 'Criar Cargo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isAdmin && (
          <View style={styles.card}>
            <Text style={styles.infoText}>Apenas administradores podem gerenciar cargos.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cargos Existentes</Text>
          {positions.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum cargo cadastrado ainda.</Text>
          ) : (
            <View style={styles.positionsList}>
              {positions.map((position) => (
                <View key={position.id} style={styles.positionItem}>
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
                </View>
              ))}
            </View>
          )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3366FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 16,
  },
  positionsList: {
    gap: 12,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
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
    color: '#111827',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
    color: '#6b7280',
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


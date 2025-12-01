import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

interface Member {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  birthDate?: string
  role: string
  avatarUrl?: string
  permissions?: Array<{ id: string; type: string }>
}

export default function MemberDetailsScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  const { user } = useAuthStore()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchMember()
    }
  }, [id])

  const fetchMember = async () => {
    try {
      const response = await api.get(`/members/${id}`)
      setMember(response.data)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar membro',
      })
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      MEMBER: 'Membro',
      COORDINATOR: 'Coordenador',
      ADMINFILIAL: 'Admin Filial',
      ADMINGERAL: 'Admin Geral',
    }
    return labels[role] || role
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Membro não encontrado</Text>
      </View>
    )
  }

  const canManagePermissions = user?.permissions?.some(p => p.type === 'MANAGE_PERMISSIONS') || user?.role === 'ADMINGERAL'
  const canViewSensitiveData = hasAccess(user, 'members_manage')

  return (
    <DetailScreenLayout
      headerProps={{
        title: "Detalhes do Membro",
        Icon: FontAwesome5,
        iconName: "user",
        rightButtonIcon: canManagePermissions ? (
          <Ionicons name="shield-outline" size={24} color="white" />
        ) : undefined,
        onRightButtonPress: canManagePermissions
          ? () => (navigation as any).navigate('EditMemberPermissions', { memberId: member.id })
          : undefined,
      }}
    >
        <View style={styles.profileSection}>
          {member.avatarUrl ? (
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(member.role)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {canViewSensitiveData && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{member.email}</Text>
                </View>
              </View>

              {member.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Telefone</Text>
                    <Text style={styles.infoValue}>{member.phone}</Text>
                  </View>
                </View>
              )}

              {member.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Endereço</Text>
                    <Text style={styles.infoValue}>{member.address}</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {member.birthDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data de Nascimento</Text>
                <Text style={styles.infoValue}>
                  {new Date(member.birthDate).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {member.permissions && member.permissions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.permissionsHeader}>
              <Ionicons name="shield-outline" size={20} color="#333" />
              <Text style={styles.permissionsTitle}>Permissões</Text>
            </View>
            <View style={styles.permissionsList}>
              {member.permissions.map((permission) => (
                <View key={permission.id} style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>{permission.type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
    </DetailScreenLayout>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#333',
  },
})


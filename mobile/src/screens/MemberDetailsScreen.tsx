import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { membersService } from '../services/members.service'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import { hasAccess } from '../utils/authUtils'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { colors } from '../theme/colors'

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
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMember = useCallback(async () => {
    try {
      setError(null)
      const data = await membersService.getById(id)
      setMember(data)
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do membro:', err)
      const errorMessage = err.response?.data?.message || 'Não foi possível carregar os detalhes do membro.'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchMember()
    }
  }, [id, fetchMember])

  // Recarrega quando a tela recebe foco (após editar)
  useFocusEffect(
    useCallback(() => {
      if (id && !loading && !refreshing) {
        fetchMember()
      }
    }, [id, fetchMember, loading, refreshing])
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMember()
  }, [fetchMember])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchMember().finally(() => setLoading(false))
  }, [fetchMember])

  const isEmpty = !loading && !member && !error

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      MEMBER: 'Membro',
      COORDINATOR: 'Coordenador',
      ADMINFILIAL: 'Admin Filial',
      ADMINGERAL: 'Admin Geral',
    }
    return labels[role] || role
  }

  const canManagePermissions = user?.permissions?.some(p => p.type === 'MANAGE_PERMISSIONS') || user?.role === 'ADMINGERAL'
  const canViewSensitiveData = hasAccess(user, 'members_manage')

  return (
    <DetailScreenLayout
      headerProps={{
        title: "Detalhes do Membro",
        Icon: FontAwesome5,
        iconName: "user",
        rightButtonIcon: canManagePermissions && member ? (
          <Ionicons name="shield-outline" size={24} color="white" />
        ) : undefined,
        onRightButtonPress: canManagePermissions && member
          ? () => navigation.navigate('Permissions' as never)
          : undefined,
      }}
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyTitle="Membro não encontrado"
      emptySubtitle="O membro solicitado não existe ou foi removido"
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onRetry={handleRetry}
    >
      {member && (
        <>
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

          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
            {canViewSensitiveData && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{member.email}</Text>
                  </View>
                </View>

                {member.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Telefone</Text>
                      <Text style={styles.infoValue}>{member.phone}</Text>
                    </View>
                  </View>
                )}

                {member.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
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
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Data de Nascimento</Text>
                  <Text style={styles.infoValue}>
                    {new Date(member.birthDate).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>
        </>
      )}
    </DetailScreenLayout>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.gradients.primary[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    color: colors.gradients.primary[1],
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: '#0F172A',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.gradients.primary[0],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  roleText: {
    color: colors.gradients.primary[1],
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  card: {
    padding: 20,
    marginBottom: 16,
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
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#0F172A',
  },
})


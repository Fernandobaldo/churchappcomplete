import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Switch,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../stores/authStore'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import { colors } from '../theme/colors'

interface Member {
  id: string
  name: string
  email: string
  role: string
  permissions: Array<{ id: string; type: string }>
  avatarUrl?: string
}

// Lista completa de permissões disponíveis
const ALL_PERMISSIONS = [
  { type: 'devotional_manage', label: 'Gerenciar Devocionais' },
  { type: 'members_view', label: 'Visualizar Membros' },
  { type: 'members_manage', label: 'Gerenciar Membros' },
  { type: 'events_manage', label: 'Gerenciar Eventos' },
  { type: 'contributions_manage', label: 'Gerenciar Contribuições' },
  { type: 'finances_manage', label: 'Gerenciar Finanças' },
  { type: 'church_manage', label: 'Gerenciar Igreja' },
]

const ROLE_LABELS: Record<string, string> = {
  MEMBER: 'Membro',
  COORDINATOR: 'Coordenador',
  ADMINFILIAL: 'Administrador de Filial',
  ADMINGERAL: 'Administrador Geral',
}

export default function PermissionsScreen() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/members')
      const membersWithPermissions = response.data.map((member: Member) => ({
        ...member,
        permissions: Array.isArray(member.permissions) ? member.permissions : [],
      }))
      setMembers(membersWithPermissions)
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      Toast.show({ type: 'error', text1: 'Erro ao carregar membros' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMembers()
  }, [fetchMembers])

  const fetchMemberDetails = async (id: string) => {
    try {
      const response = await api.get(`/members/${id}`)
      const member = {
        ...response.data,
        permissions: Array.isArray(response.data.permissions) ? response.data.permissions : [],
      }
      setSelectedMember(member)
    } catch (error) {
      console.error('Erro ao carregar detalhes do membro:', error)
      Toast.show({ type: 'error', text1: 'Erro ao carregar detalhes do membro' })
      setSelectedMember(null)
    }
  }

  const handleMemberSelect = (member: Member) => {
    fetchMemberDetails(member.id)
  }

  // Verifica se o membro é ADMINGERAL
  const isAdminGeral = (member: Member | null) => member?.role === 'ADMINGERAL'

  // Retorna todas as permissões se for ADMINGERAL, senão retorna as permissões do membro
  const getEffectivePermissions = (member: Member | null) => {
    if (isAdminGeral(member)) {
      return ALL_PERMISSIONS.map(p => ({ id: `auto-${p.type}`, type: p.type }))
    }
    return member?.permissions || []
  }

  // Verifica se uma permissão requer role de coordenador ou superior
  const requiresCoordinatorRole = (permissionType: string): boolean => {
    return permissionType === 'finances_manage' ||
           permissionType === 'church_manage' ||
           permissionType === 'contributions_manage' ||
           permissionType === 'members_manage'
  }

  // Verifica se o membro tem role adequada para uma permissão específica
  const hasRequiredRoleForPermission = (member: Member | null, permissionType: string): boolean => {
    if (!member) return false

    if (requiresCoordinatorRole(permissionType)) {
      const validRoles = ['COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL']
      return validRoles.includes(member.role)
    }

    return true
  }

  // Verifica se o usuário pode alterar roles
  const canChangeRole = (targetMember: Member | null) => {
    if (!user || !targetMember) return false

    // ADMINGERAL pode alterar roles de qualquer membro da igreja (exceto criar outro ADMINGERAL)
    if (user.role === 'ADMINGERAL') {
      return targetMember.role !== 'ADMINGERAL'
    }

    // ADMINFILIAL pode alterar roles de membros da sua filial (apenas para COORDINATOR ou MEMBER)
    if (user.role === 'ADMINFILIAL') {
      return targetMember.role !== 'ADMINGERAL' && targetMember.role !== 'ADMINFILIAL'
    }

    return false
  }

  // Filtra membros por nome
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoleChange = async (newRole: string) => {
    if (!selectedMember) return

    if (selectedMember.role === newRole) return

    const originalRole = selectedMember.role
    const originalPermissions = [...(selectedMember.permissions || [])]

    setUpdating(true)
    try {
      await api.patch(`/members/${selectedMember.id}/role`, { role: newRole })

      const memberResponse = await api.get(`/members/${selectedMember.id}`)
      const updatedMember = {
        ...memberResponse.data,
        permissions: memberResponse.data.permissions || [],
      }

      setSelectedMember(updatedMember)
      setMembers(members.map(m =>
        m.id === selectedMember.id
          ? { ...m, role: updatedMember.role, permissions: updatedMember.permissions || [] }
          : m
      ))

      const removedPermissions = originalPermissions
        .map((p) => typeof p === 'string' ? p : p?.type)
        .filter((perm: string) => !(updatedMember.permissions || []).some((p) =>
          (typeof p === 'string' ? p : p?.type) === perm
        ))

      if (removedPermissions.length > 0) {
        Toast.show({
          type: 'info',
          text1: 'Role alterada',
          text2: `${removedPermissions.length} permissão(ões) foram removidas por não serem compatíveis.`,
        })
      } else {
        Toast.show({
          type: 'success',
          text1: `Role alterada para ${ROLE_LABELS[newRole] || newRole}`,
        })
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } }
      setSelectedMember({
        ...selectedMember,
        role: originalRole,
        permissions: originalPermissions,
      })
      Toast.show({
        type: 'error',
        text1: apiError.response?.data?.error || 'Erro ao alterar role do membro',
      })
    } finally {
      setUpdating(false)
    }
  }

  const togglePermission = async (permissionType: string) => {
    if (!selectedMember) return

    // ADMINGERAL não pode ter permissões removidas
    if (isAdminGeral(selectedMember)) {
      Toast.show({
        type: 'error',
        text1: 'Administrador Geral possui todas as permissões automaticamente',
      })
      return
    }

    // Verifica se a permissão requer role de coordenador ou superior
    if (requiresCoordinatorRole(permissionType) && !hasRequiredRoleForPermission(selectedMember, permissionType)) {
      Toast.show({
        type: 'error',
        text1: 'Esta permissão requer que o membro tenha role de Coordenador ou superior',
      })
      return
    }

    const originalPermissions = [...(selectedMember.permissions || [])]
    const currentPermissions = (selectedMember.permissions || []).map((p) =>
      typeof p === 'string' ? p : p?.type
    ).filter(Boolean)

    const hasPermission = currentPermissions.includes(permissionType)
    const newPermissions = hasPermission
      ? currentPermissions.filter(p => p !== permissionType)
      : [...currentPermissions, permissionType]

    // Atualização otimista
    const updatedPermissions = newPermissions.map(type => ({ id: `temp-${type}`, type }))
    setSelectedMember({
      ...selectedMember,
      permissions: updatedPermissions,
    })

    setUpdating(true)
    try {
      await api.post(`/permissions/${selectedMember.id}`, { permissions: newPermissions })

      const memberResponse = await api.get(`/members/${selectedMember.id}`)
      const updatedMember = {
        ...memberResponse.data,
        permissions: memberResponse.data.permissions || [],
      }

      setSelectedMember(updatedMember)
      setMembers(members.map(m =>
        m.id === selectedMember.id
          ? { ...m, permissions: updatedMember.permissions || [] }
          : m
      ))

      Toast.show({
        type: 'success',
        text1: hasPermission ? 'Permissão removida com sucesso!' : 'Permissão adicionada com sucesso!',
      })
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } }
      setSelectedMember({
        ...selectedMember,
        permissions: originalPermissions,
      })
      Toast.show({
        type: 'error',
        text1: apiError.response?.data?.message || 'Erro ao atualizar permissão',
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <ViewScreenLayout
        headerProps={{ title: "Permissões" }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
        </View>
      </ViewScreenLayout>
    )
  }

  return (
    <ViewScreenLayout
      headerProps={{ title: "Permissões" }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
        <Text style={styles.subtitle}>Gerencie as permissões dos membros</Text>

        {/* Busca */}
        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </GlassCard>

        {/* Lista de Membros */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Membros</Text>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id
                return (
                  <GlassCard
                    key={member.id}
                    onPress={() => handleMemberSelect(member)}
                    opacity={isSelected ? 0.5 : 0.4}
                    blurIntensity={20}
                    borderRadius={20}
                    style={[styles.memberCard, isSelected && styles.memberCardSelected]}
                  >
                    <View style={styles.memberInfo}>
                      {member.avatarUrl && typeof member.avatarUrl === 'string' && member.avatarUrl.trim().length > 0 ? (
                        <Image
                          source={{
                            uri: member.avatarUrl.startsWith('http')
                              ? member.avatarUrl
                              : `${api.defaults.baseURL}${member.avatarUrl}`,
                          }}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <View style={styles.memberAvatarPlaceholder}>
                          <Text style={[styles.memberAvatarText, isSelected && styles.memberAvatarTextSelected]}>
                            {member.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, isSelected && styles.memberNameSelected]}>
                          {member.name}
                        </Text>
                        <Text style={[styles.memberEmail, isSelected && styles.memberEmailSelected]}>
                          {member.email}
                        </Text>
                        <View style={styles.memberRoleBadge}>
                          <Text style={[styles.memberRoleText, isSelected && styles.memberRoleTextSelected]}>
                            {ROLE_LABELS[member.role] || member.role}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                )
              })}
            </View>
          )}
        </View>

        {/* Detalhes do Membro Selecionado */}
        {selectedMember && (
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsMemberInfo}>
                {selectedMember.avatarUrl && typeof selectedMember.avatarUrl === 'string' && selectedMember.avatarUrl.trim().length > 0 ? (
                  <Image
                    source={{
                      uri: selectedMember.avatarUrl.startsWith('http')
                        ? selectedMember.avatarUrl
                        : `${api.defaults.baseURL}${selectedMember.avatarUrl}`,
                    }}
                    style={styles.detailsAvatar}
                  />
                ) : (
                  <View style={styles.detailsAvatarPlaceholder}>
                    <Text style={styles.detailsAvatarText}>
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.detailsTitle}>Permissões de {selectedMember.name}</Text>
                  <Text style={styles.detailsEmail}>{selectedMember.email}</Text>
                </View>
              </View>
            </View>

            {/* Role Selector */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Role:</Text>
              {canChangeRole(selectedMember) ? (
                <View style={styles.rolePickerContainer}>
                  <Picker
                    selectedValue={selectedMember.role}
                    onValueChange={handleRoleChange}
                    style={styles.rolePicker}
                    enabled={!updating}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => {
                      if (value === 'ADMINGERAL') return null
                      if (user?.role === 'ADMINFILIAL' && (value === 'ADMINFILIAL' || value === 'ADMINGERAL')) {
                        return null
                      }
                      return (
                        <Picker.Item key={value} label={label} value={value} />
                      )
                    })}
                  </Picker>
                </View>
              ) : (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {ROLE_LABELS[selectedMember.role] || selectedMember.role}
                  </Text>
                </View>
              )}
            </View>

            {/* ADMINGERAL Info */}
            {isAdminGeral(selectedMember) && (
              <View style={styles.adminInfo}>
                <Ionicons name="flash" size={20} color="#2563eb" />
                <Text style={styles.adminInfoText}>
                  Administrador Geral possui todas as permissões automaticamente
                </Text>
              </View>
            )}

            {/* Permissões Ativas */}
            {(() => {
              const effectivePermissions = getEffectivePermissions(selectedMember)
              if (effectivePermissions.length > 0) {
                return (
                  <View style={styles.activePermissionsSection}>
                    <Text style={styles.activePermissionsTitle}>
                      Permissões Ativas ({effectivePermissions.length})
                    </Text>
                    <View style={styles.activePermissionsList}>
                      {effectivePermissions.map((permission) => {
                        const permLabel = ALL_PERMISSIONS.find(p => p.type === permission.type)?.label || permission.type
                        return (
                          <View key={permission.id} style={styles.activePermissionBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                            <Text style={styles.activePermissionText}>{permLabel}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                )
              }
              return null
            })()}

            {/* Lista de Permissões */}
            <View style={styles.permissionsSection}>
              <Text style={styles.permissionsTitle}>
                {isAdminGeral(selectedMember) ? 'Permissões Disponíveis' : 'Atribuir Permissões'}
              </Text>
              <View style={styles.permissionsList}>
                {ALL_PERMISSIONS.map((permission) => {
                  const isAdmin = isAdminGeral(selectedMember)
                  const memberPermissions = Array.isArray(selectedMember.permissions)
                    ? selectedMember.permissions
                    : []
                  
                  const hasPermission = isAdmin
                    ? true
                    : memberPermissions.some(p => p && p.type === permission.type)

                  const requiresRole = requiresCoordinatorRole(permission.type)
                  const hasRequiredRole = hasRequiredRoleForPermission(selectedMember, permission.type)
                  const shouldDisableToggle = isAdmin || (requiresRole && !hasRequiredRole)

                  return (
                    <View key={permission.type}>
                      <View
                        style={[
                          styles.permissionItem,
                          hasPermission && styles.permissionItemActive,
                          shouldDisableToggle && styles.permissionItemDisabled,
                        ]}
                      >
                        <View style={styles.permissionInfo}>
                          {hasPermission ? (
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                          ) : (
                            <Ionicons name="ellipse-outline" size={20} color="#9ca3af" />
                          )}
                          <View style={styles.permissionTextContainer}>
                            <Text style={[styles.permissionLabel, hasPermission && styles.permissionLabelActive]}>
                              {permission.label}
                            </Text>
                            <Text style={styles.permissionType}>{permission.type}</Text>
                          </View>
                        </View>
                        <Switch
                          value={hasPermission}
                          onValueChange={() => togglePermission(permission.type)}
                          disabled={shouldDisableToggle || updating}
                          trackColor={{ false: '#d1d5db', true: '#3366FF' }}
                          thumbColor="#fff"
                        />
                      </View>
                      {shouldDisableToggle && requiresRole && !hasRequiredRole && (
                        <View style={styles.permissionWarning}>
                          <Text style={styles.permissionWarningText}>
                            ⚠️ Esta permissão requer que o membro tenha role de <Text style={styles.permissionWarningBold}>Coordenador</Text> ou superior. Altere a role do membro para habilitar esta permissão.
                          </Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          </GlassCard>
        )}

        {!selectedMember && (
          <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.noSelectionContainer}>
            <Ionicons name="shield-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.noSelectionText}>Selecione um membro para gerenciar permissões</Text>
          </GlassCard>
        )}
    </ViewScreenLayout>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchCard: {
    padding: 0,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text.primary,
    backgroundColor: 'transparent',
    includeFontPadding: false,
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#64748B',
  },
  membersList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  memberCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: colors.glass.border,
  },
  memberCardSelected: {
    borderColor: colors.gradients.primary[1],
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3366FF',
  },
  memberAvatarTextSelected: {
    color: '#3366FF',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 2,
  },
  memberNameSelected: {
    color: colors.gradients.primary[1],
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
    marginBottom: 4,
  },
  memberEmailSelected: {
    color: colors.gradients.primary[0],
  },
  memberRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.glass.overlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: '#475569',
  },
  memberRoleTextSelected: {
    color: colors.gradients.primary[1],
  },
  detailsSection: {
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  detailsMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  detailsAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3366FF',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 4,
  },
  detailsEmail: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#475569',
  },
  roleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#0F172A',
  },
  rolePickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: 16,
    backgroundColor: colors.glass.overlay,
  },
  rolePicker: {
    height: 50,
  },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3366FF',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  adminInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  activePermissionsSection: {
    marginBottom: 24,
  },
  activePermissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  activePermissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activePermissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activePermissionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16a34a',
  },
  permissionsSection: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
  },
  permissionItemActive: {
    borderColor: colors.status.success,
  },
  permissionItemDisabled: {
    opacity: 0.6,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 2,
  },
  permissionLabelActive: {
    color: colors.status.success,
  },
  permissionType: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: '#64748B',
  },
  permissionWarning: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  permissionWarningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  permissionWarningBold: {
    fontWeight: '600',
  },
  noSelectionContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  noSelectionText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
})

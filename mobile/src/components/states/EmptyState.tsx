import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import GlassCard from '../GlassCard'
import { colors } from '../../theme/colors'

type EmptyStateProps = {
  title: string
  subtitle?: string
  icon?: keyof typeof Ionicons.glyphMap
  iconSize?: number
  iconColor?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title,
  subtitle,
  icon = 'document-outline',
  iconSize = 64,
  iconColor = colors.text.tertiary,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {actionLabel && onAction && (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            style={styles.actionButton}
          >
            <LinearGradient
              colors={colors.gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>{actionLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </GlassCard>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
    maxWidth: 200,
    marginTop: 8,
  },
  actionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.light,
  },
})


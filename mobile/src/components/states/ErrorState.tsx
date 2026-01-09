import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import GlassCard from '../GlassCard'
import { colors } from '../../theme/colors'

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  retryLabel?: string
  icon?: keyof typeof Ionicons.glyphMap
  iconSize?: number
  iconColor?: string
}

export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  icon = 'alert-circle-outline',
  iconSize = 64,
  iconColor = colors.status.error,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            activeOpacity={0.8}
            style={styles.retryButton}
          >
            <LinearGradient
              colors={colors.gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.text.light} style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>{retryLabel}</Text>
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
  message: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    width: '100%',
    maxWidth: 200,
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.light,
  },
})


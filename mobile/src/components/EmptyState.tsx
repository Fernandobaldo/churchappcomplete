import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import GlassCard from './GlassCard'
import { colors } from '../theme/colors'

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap
  message: string
  iconSize?: number
  iconColor?: string
}

export default function EmptyState({
  icon = 'document-outline',
  message,
  iconSize = 64,
  iconColor = colors.text.tertiary,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
        <Text style={styles.text}>{message}</Text>
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
    paddingVertical: 64,
    paddingHorizontal: 32,
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#475569',
    marginTop: 20,
    textAlign: 'center',
  },
})



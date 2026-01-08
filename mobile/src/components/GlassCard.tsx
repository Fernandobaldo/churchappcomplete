import React, { memo, useMemo } from 'react'
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '../theme/colors'

type GlassCardProps = {
  children?: React.ReactNode
  style?: ViewStyle | ViewStyle[]
  contentStyle?: ViewStyle
  opacity?: number
  blurIntensity?: number
  borderRadius?: number
  onPress?: () => void
  disabled?: boolean
  shadowVariant?: 'light' | 'default' | 'heavy'
}

const GlassCard = memo(function GlassCard({
  children,
  style,
  contentStyle,
  opacity = 0.35,
  blurIntensity = 20,
  borderRadius = 20,
  onPress,
  disabled = false,
  shadowVariant = 'default',
}: GlassCardProps) {
  const shadowStyle = useMemo(() => {
    return shadowVariant === 'light'
      ? colors.shadow.glassLight
      : shadowVariant === 'heavy'
      ? colors.shadow.glassHeavy
      : colors.shadow.glass
  }, [shadowVariant])

  const cardStyle = useMemo(() => [
    styles.card,
    {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      borderRadius,
      borderWidth: 1,
      borderColor: colors.glass.border,
    },
    shadowStyle,
    style,
  ], [opacity, borderRadius, shadowStyle, style])

  const cardContent = (
    <BlurView
      intensity={blurIntensity}
      tint="light"
      style={cardStyle}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </BlurView>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    )
  }

  return cardContent
})

export default GlassCard

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    backgroundColor: 'transparent', // Garante que o conteúdo seja renderizado
  },
  touchable: {
    // Permite que o TouchableOpacity envolva o card
  },
})


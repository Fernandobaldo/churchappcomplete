import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

type LoadingStateProps = {
  size?: 'small' | 'large' | number
  color?: string
  message?: string
}

export default function LoadingState({
  size = 'large',
  color = colors.gradients.primary[1],
  message,
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
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
  messageContainer: {
    marginTop: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})


import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ViewStyle,
  InteractionManager,
} from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'
import GlassBackground from '../GlassBackground'

type FormScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  contentContainerStyle?: ViewStyle
  backgroundImageUri?: string
}

export default function FormScreenLayout({
  headerProps,
  children,
  backgroundColor,
  contentContainerStyle,
  backgroundImageUri,
}: FormScreenLayoutProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true)
    })
    return () => interaction.cancel()
  }, [])

  return (
    <GlassBackground
      imageUri={backgroundImageUri}
      overlayOpacity={0.35}
      blurIntensity={15}
      style={styles.container}
    >
      <PageHeader {...headerProps} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {isReady ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.scrollView} />
        )}
      </KeyboardAvoidingView>
    </GlassBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 110, // Altura do header fixo
  },
  scrollContent: {
    padding: 16, // Padding aumentado para sensação premium
    paddingBottom: 40,
  },
})


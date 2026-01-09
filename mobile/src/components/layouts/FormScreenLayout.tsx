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
import { LoadingState, ErrorState, EmptyState } from '../states'

type FormScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  contentContainerStyle?: ViewStyle
  backgroundImageUri?: string
  topSlot?: React.ReactNode
  bottomSlot?: React.ReactNode
  floatingSlot?: React.ReactNode
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  onRetry?: () => void
}

export default function FormScreenLayout({
  headerProps,
  children,
  backgroundColor,
  contentContainerStyle,
  backgroundImageUri,
  topSlot,
  bottomSlot,
  floatingSlot,
  loading = false,
  error = null,
  empty = false,
  emptyTitle,
  emptySubtitle,
  onRetry,
}: FormScreenLayoutProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true)
    })
    return () => interaction.cancel()
  }, [])

  // Priority logic: loading > error > empty > children
  const renderContent = () => {
    if (loading) {
      return <LoadingState />
    }
    if (error) {
      return <ErrorState message={error} onRetry={onRetry} />
    }
    if (empty) {
      return (
        <EmptyState
          title={emptyTitle || 'Nenhum item encontrado'}
          subtitle={emptySubtitle}
        />
      )
    }
    return (
      <>
        {topSlot}
        {children}
        {bottomSlot}
      </>
    )
  }

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
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.scrollView} />
        )}
      </KeyboardAvoidingView>
      {floatingSlot && (
        <View style={styles.floatingSlot} pointerEvents="box-none">
          {floatingSlot}
        </View>
      )}
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
  floatingSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})


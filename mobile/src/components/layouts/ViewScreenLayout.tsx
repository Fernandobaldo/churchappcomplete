import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, ViewStyle, InteractionManager } from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'
import GlassBackground from '../GlassBackground'
import { colors } from '../../theme/colors'
import { LoadingState, ErrorState, EmptyState } from '../states'

type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  refreshing?: boolean
  onRefresh?: () => void
  scrollable?: boolean
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

export default function ViewScreenLayout({
  headerProps,
  children,
  backgroundColor,
  refreshing = false,
  onRefresh,
  scrollable = true,
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
}: ViewScreenLayoutProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Adia renderização pesada até após animação de navegação
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

  // Detecta se estamos em um estado (loading/error/empty) que precisa de ScrollView para pull-to-refresh
  const isInState = loading || error || empty
  
  // Quando scrollable=false mas temos onRefresh e estamos em estado, usa ScrollView para permitir pull-to-refresh
  const needsScrollViewForRefresh = !scrollable && onRefresh && isInState

  // Determina o container a usar
  const useScrollView = scrollable || needsScrollViewForRefresh

  return (
    <GlassBackground
      imageUri={backgroundImageUri}
      overlayOpacity={0.35}
      blurIntensity={15}
      style={styles.container}
    >
      <PageHeader {...headerProps} />
      {isReady ? (
        useScrollView ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              scrollable ? styles.scrollContent : styles.content,
              isInState && needsScrollViewForRefresh ? styles.stateScrollContent : undefined,
              contentContainerStyle
            ]}
            refreshControl={
              onRefresh && !loading ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={colors.gradients.primary}
                  tintColor={colors.gradients.primary[1]}
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentContainerStyle]} pointerEvents="box-none">
            {renderContent()}
          </View>
        )
      ) : (
        <View style={[styles.content, contentContainerStyle]} />
      )}
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
  scrollView: {
    flex: 1,
    marginTop: 110, // Altura do header fixo
  },
  scrollContent: {
    padding: 16, // Padding aumentado para sensação premium
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    marginTop: 110,
    padding: 16,
  },
  stateScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    marginTop: -90, 
  },
  floatingSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

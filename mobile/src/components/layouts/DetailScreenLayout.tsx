import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Image, RefreshControl, ImageBackground, InteractionManager } from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'
import GlassBackground from '../GlassBackground'
import { colors } from '../../theme/colors'
import { LoadingState, ErrorState, EmptyState } from '../states'

type DetailScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  imageUrl?: string | null
  loading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  backgroundImageUri?: string
  topSlot?: React.ReactNode
  bottomSlot?: React.ReactNode
  floatingSlot?: React.ReactNode
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  onRetry?: () => void
}

export default function DetailScreenLayout({
  headerProps,
  children,
  backgroundColor,
  imageUrl,
  loading = false,
  refreshing = false,
  onRefresh,
  backgroundImageUri,
  topSlot,
  bottomSlot,
  floatingSlot,
  error = null,
  empty = false,
  emptyTitle,
  emptySubtitle,
  onRetry,
}: DetailScreenLayoutProps) {
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
      {!loading && !error && !empty && imageUrl && (
        <View style={styles.imageContainer}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            defaultSource={require('../../../assets/worshipImage.png')}
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        </View>
      )}
      {isReady ? (
        <ScrollView
          style={[styles.scrollView, !loading && !error && !empty && imageUrl && styles.scrollViewWithImage]}
          contentContainerStyle={styles.scrollContent}
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
        >
          {renderContent()}
        </ScrollView>
      ) : (
        <View style={[styles.scrollView, !loading && !error && !empty && imageUrl && styles.scrollViewWithImage]} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
  },
  imageContainer: {
    marginTop: 110, // Altura do header fixo
    height: 250, // Altura aumentada para hero section
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
    marginTop: 110, // Quando não tem imagem
  },
  scrollViewWithImage: {
    marginTop: -30, // Overlap sutil com a imagem para cards flutuantes
  },
  scrollContent: {
    padding: 16, // Padding aumentado para sensação premium
    paddingTop: 30, // Espaço para cards flutuantes quando há imagem
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


import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, ViewStyle, InteractionManager } from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'
import GlassBackground from '../GlassBackground'
import { colors } from '../../theme/colors'

type ViewScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  refreshing?: boolean
  onRefresh?: () => void
  scrollable?: boolean
  contentContainerStyle?: ViewStyle
  backgroundImageUri?: string
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
}: ViewScreenLayoutProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Adia renderização pesada até após animação de navegação
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
      {isReady ? (
        scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            refreshControl={
              onRefresh ? (
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
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentContainerStyle]} pointerEvents="box-none">
            {children}
          </View>
        )
      ) : (
        <View style={[styles.content, contentContainerStyle]} />
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
})


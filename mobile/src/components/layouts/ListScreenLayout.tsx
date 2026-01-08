import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text, InteractionManager } from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'
import GlassBackground from '../GlassBackground'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

type ListScreenLayoutProps<T> = {
  headerProps: PageHeaderProps
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement
  keyExtractor: (item: T, index: number) => string
  loading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  onEndReached?: () => void
  ListHeaderComponent?: React.ReactElement
  ListEmptyComponent?: React.ReactElement
  backgroundColor?: string
  contentContainerStyle?: object
  backgroundImageUri?: string
}

export default function ListScreenLayout<T>({
  headerProps,
  data,
  renderItem,
  keyExtractor,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
  backgroundColor,
  contentContainerStyle,
  backgroundImageUri,
}: ListScreenLayoutProps<T>) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true)
    })
    return () => interaction.cancel()
  }, [])

  if (loading) {
    return (
      <GlassBackground
        imageUri={backgroundImageUri}
        overlayOpacity={0.35}
        blurIntensity={15}
        style={styles.container}
      >
        <PageHeader {...headerProps} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradients.primary[1]} />
        </View>
      </GlassBackground>
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
      {isReady ? (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={[styles.listContent, contentContainerStyle]}
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
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={
            ListEmptyComponent || (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum item encontrado</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={styles.list} />
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
  list: {
    flex: 1,
    marginTop: 110, // Altura do header fixo
  },
  listContent: {
    padding: 16, // Padding aumentado para sensação premium
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.tertiary,
  },
})


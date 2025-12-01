import React from 'react'
import { View, StyleSheet, ScrollView, Image } from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'

type DetailScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
  imageUrl?: string | null
}

export default function DetailScreenLayout({
  headerProps,
  children,
  backgroundColor = '#f5f5f5',
  imageUrl,
}: DetailScreenLayoutProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <PageHeader {...headerProps} />
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}
      <ScrollView
        style={[styles.scrollView, imageUrl && styles.scrollViewWithImage]}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    marginTop: 110, // Altura do header fixo
  },
  image: {
    width: '100%',
    height: 200,
  },
  scrollView: {
    flex: 1,
    marginTop: 110, // Quando não tem imagem
  },
  scrollViewWithImage: {
    marginTop: 0, // Quando tem imagem, não precisa marginTop
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
})


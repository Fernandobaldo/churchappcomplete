import React, { memo, useMemo } from 'react'
import { View, StyleSheet, ImageBackground, ImageSourcePropType, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme/colors'

type GlassBackgroundProps = {
  children?: React.ReactNode
  imageSource?: ImageSourcePropType
  imageUri?: string
  overlayOpacity?: number
  blurIntensity?: number
  gradientColors?: string[]
  style?: ViewStyle
}

const GlassBackground = memo(function GlassBackground({
  children,
  imageSource,
  imageUri,
  overlayOpacity = 0.35,
  blurIntensity = 20,
  gradientColors,
  style,
}: GlassBackgroundProps) {
  const imageProps = useMemo(() => {
    if (imageUri) {
      // Verifica se a URI é válida (não vazia ou null)
      if (typeof imageUri === 'string' && imageUri.trim() !== '') {
        return { uri: imageUri }
      }
    }
    if (imageSource) {
      return imageSource
    }
    // Usa app-background.png como background padrão do app
    return require('../../assets/app-background.png')
  }, [imageUri, imageSource])

  const overlayStyle = useMemo(() => ({
    backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})`,
  }), [overlayOpacity])

  return (
    <View style={[styles.container, style]}>
      <ImageBackground
        source={imageProps}
        style={styles.imageBackground}
        resizeMode="cover"
        defaultSource={require('../../assets/app-background.png')}
      >
        <BlurView 
          intensity={blurIntensity} 
          style={styles.blurView}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
        >
          {gradientColors ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { opacity: 0.3 }]}
            />
          ) : null}
          
          <View style={[styles.overlay, overlayStyle]} />
          
          {children}
        </BlurView>
      </ImageBackground>
    </View>
  )
})

export default GlassBackground

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})


/**
 * Design Tokens for Mobile App
 * 
 * This file provides standardized design tokens for spacing, typography, 
 * radius, glass effects, and shadows. Use these tokens to maintain 
 * consistency across the app.
 * 
 * Usage:
 *   import { tokens } from '../theme/tokens'
 *   
 *   // Spacing
 *   padding: tokens.spacing.md
 *   
 *   // Radius
 *   borderRadius: tokens.radius.lg
 *   
 *   // Typography
 *   fontSize: tokens.typography.sizes.base
 *   fontWeight: tokens.typography.weights.semiBold
 *   lineHeight: tokens.typography.lineHeights.normal
 *   
 *   // Glass effects
 *   opacity: tokens.glass.defaultOpacity
 *   blurIntensity: tokens.glass.defaultBlur
 *   
 *   // Shadows
 *   ...tokens.shadow.glass
 */

import { colors } from './colors'
import { typography } from './typography'

/**
 * Spacing scale
 * Base unit: 4px (common in design systems)
 * Provides consistent spacing for padding, margins, and gaps
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
} as const

/**
 * Radius scale
 * Base unit: 4px
 * Provides consistent border radius values
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999, // Fully rounded (circle)
} as const

/**
 * Typography scale
 * References the existing typography system for consistency
 */
export const typographyScale = {
  sizes: typography.fontSize,
  weights: typography.fontWeight,
  lineHeights: typography.lineHeight,
  // Convenience accessors that mirror typography structure
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  lineHeight: typography.lineHeight,
} as const

/**
 * Glass effect defaults
 * Based on common values used across GlassCard and layouts
 */
export const glass = {
  // Default opacity for glass cards and backgrounds
  defaultOpacity: 0.35,
  
  // Default blur intensity for glass effects
  defaultBlur: 20,
  
  // Alternative values for different use cases
  opacity: {
    light: 0.25,
    default: 0.35,
    medium: 0.45,
    heavy: 0.55,
  },
  
  blur: {
    subtle: 10,
    default: 20,
    strong: 30,
    intense: 40,
  },
} as const

/**
 * Shadow presets
 * References existing shadow definitions from colors.shadow
 * Provides convenient access to shadow styles
 */
export const shadow = {
  // Light shadow - subtle elevation
  light: colors.shadow.glassLight,
  
  // Default shadow - standard elevation
  default: colors.shadow.glass,
  
  // Heavy shadow - strong elevation
  heavy: colors.shadow.glassHeavy,
  
  // Convenience aliases matching shadow variant names
  glass: colors.shadow.glass,
  glassLight: colors.shadow.glassLight,
  glassHeavy: colors.shadow.glassHeavy,
} as const

/**
 * Complete tokens object
 * Export all tokens together for easy importing
 */
export const tokens = {
  spacing,
  radius,
  typography: typographyScale,
  glass,
  shadow,
} as const

export default tokens


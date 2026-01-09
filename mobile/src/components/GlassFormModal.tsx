import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import GlassCard from './GlassCard'
import { colors } from '../theme/colors'

export interface GlassFormModalProps {
  visible: boolean
  title: string
  onClose: () => void
  onSubmit: () => void | Promise<void>
  children: React.ReactNode
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  submitDisabled?: boolean
  showCloseButton?: boolean
  position?: 'center' | 'bottom'
  buttonsOutsideScroll?: boolean
}

export default function GlassFormModal({
  visible,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  loading = false,
  submitDisabled = false,
  showCloseButton = false,
  position = 'bottom',
  buttonsOutsideScroll = false,
}: GlassFormModalProps) {
  const handleSubmit = async () => {
    if (!loading && !submitDisabled) {
      await onSubmit()
    }
  }

  const renderButtons = () => (
    <>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onClose}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelText}>{cancelLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading || submitDisabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            loading || submitDisabled
              ? ['#94A3B8', '#94A3B8']
              : (colors.gradients.primary as [string, string])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitButtonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, position === 'center' && styles.overlayWithBackground]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View
          style={[
            styles.overlayInner,
            position === 'center' && styles.overlayCenter,
            position === 'bottom' && styles.overlayBottom,
          ]}
        >
          <GlassCard
            opacity={0.45}
            blurIntensity={25}
            borderRadius={position === 'bottom' ? 24 : 20}
            style={[
              styles.content,
              position === 'bottom' && styles.contentBottom,
              position === 'center' && styles.contentCenter,
            ]}
          >
            {showCloseButton && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            )}

            {!showCloseButton && (
              <Text style={[styles.title, position === 'center' && styles.titleWithPadding]}>
                {title}
              </Text>
            )}

            {buttonsOutsideScroll ? (
              <>
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={[
                    styles.scrollContent,
                    buttonsOutsideScroll && styles.scrollContentButtonsOutside,
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
                <View style={[styles.buttons, buttonsOutsideScroll && styles.buttonsOutside]}>
                  {renderButtons()}
                </View>
              </>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
                <View style={styles.buttons}>{renderButtons()}</View>
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayWithBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayInner: {
    flex: 1,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    overflow: 'hidden',
  },
  contentBottom: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
  },
  contentCenter: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 24,
    color: colors.text.primary,
  },
  titleWithPadding: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  scrollContentButtonsOutside: {
    paddingBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  buttonsOutside: {
    marginTop: 0,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.glass.overlay,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  cancelText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
})


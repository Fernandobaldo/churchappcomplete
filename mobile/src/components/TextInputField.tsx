import React, { memo } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

type TextInputFieldProps = {
  fieldKey: string
  label: string
  value: string
  placeholder?: string
  required?: boolean
  error?: string
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
  multiline?: boolean
  maxLength?: number
  onChangeText: (text: string) => void
}

function TextInputFieldComponent({
  fieldKey,
  label,
  value,
  placeholder = '',
  required = false,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  maxLength,
  onChangeText,
}: TextInputFieldProps) {
  const inputStyle = multiline ? styles.inputDescription : styles.input
  const finalInputStyle = error ? [inputStyle, styles.inputError] : inputStyle

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={finalInputStyle}
          value={value || ''}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          maxLength={maxLength}
          blurOnSubmit={false}
          returnKeyType="next"
          onChangeText={onChangeText}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

TextInputFieldComponent.displayName = 'TextInputField'

// Função de comparação para memo - ignora onChangeText na comparação
function areEqual(prevProps: TextInputFieldProps, nextProps: TextInputFieldProps) {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.required === nextProps.required &&
    prevProps.label === nextProps.label &&
    prevProps.fieldKey === nextProps.fieldKey &&
    prevProps.keyboardType === nextProps.keyboardType &&
    prevProps.secureTextEntry === nextProps.secureTextEntry &&
    prevProps.autoCapitalize === nextProps.autoCapitalize &&
    prevProps.autoCorrect === nextProps.autoCorrect &&
    prevProps.multiline === nextProps.multiline &&
    prevProps.maxLength === nextProps.maxLength
  )
}

const TextInputField = memo(TextInputFieldComponent, areEqual)

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
    marginTop: 16,
    color: colors.text.primary,
  },
  required: {
    color: colors.status.error,
    fontWeight: typography.fontWeight.bold,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: colors.glass.overlay,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...colors.shadow.glassLight,
    marginBottom: 0,
    padding: 0,
  },
  input: {
    borderWidth: 0,
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '400',
    color: '#0F172A',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputDescription: {
    height: 100,
    borderWidth: 0,
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    fontSize: 16,
    fontWeight: '400',
    color: '#0F172A',
    includeFontPadding: false,
  },
  inputError: {
    borderColor: colors.status.error,
    borderWidth: 1.5,
  },
  errorText: {
    ...typography.styles.captionSmall,
    color: colors.status.error,
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
})

export default TextInputField


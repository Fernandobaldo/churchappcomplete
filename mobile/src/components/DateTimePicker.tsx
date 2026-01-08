import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

export type DateTimePickerMode = 'date' | 'time' | 'datetime'

interface DateTimePickerProps {
  value?: Date | string | null // Date object ou string formatada
  onChange: (value: Date | string) => void
  mode?: DateTimePickerMode
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  minimumDate?: Date
  maximumDate?: Date
  display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'compact'
}

export default function DateTimePickerComponent({
  value,
  onChange,
  mode = 'date',
  placeholder,
  label,
  required = false,
  error,
  minimumDate,
  maximumDate,
  display,
}: DateTimePickerProps) {
  const [currentValue, setCurrentValue] = useState<Date>(() => {
    if (value) {
      if (value instanceof Date) {
        // Garante que a data está sendo interpretada corretamente
        const year = value.getFullYear()
        const month = value.getMonth()
        const day = value.getDate()
        return new Date(year, month, day)
      }
      if (typeof value === 'string') {
        // Tenta parsear diferentes formatos
        if (mode === 'date') {
          // Formato DD/MM/YYYY
          try {
            const parsed = parse(value, 'dd/MM/yyyy', new Date())
            if (isValid(parsed)) {
              // Garante que a data está sendo interpretada corretamente
              const year = parsed.getFullYear()
              const month = parsed.getMonth()
              const day = parsed.getDate()
              return new Date(year, month, day)
            }
          } catch (e) {
            // Ignora erro de parse
          }
        } else if (mode === 'time') {
          // Formato HH:mm
          const [hours, minutes] = value.split(':').map(Number)
          const date = new Date()
          date.setHours(hours || 0, minutes || 0, 0, 0)
          return date
        }
        // Tenta parsear como ISO string
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = date.getMonth()
          const day = date.getDate()
          return new Date(year, month, day)
        }
      }
    }
    return new Date()
  })

  // Atualiza o valor quando a prop value muda
  useEffect(() => {
    if (value) {
      if (value instanceof Date) {
        // Garante que a data está sendo interpretada corretamente
        const year = value.getFullYear()
        const month = value.getMonth()
        const day = value.getDate()
        setCurrentValue(new Date(year, month, day))
      } else if (typeof value === 'string') {
        if (mode === 'date') {
          try {
            const parsed = parse(value, 'dd/MM/yyyy', new Date())
            if (isValid(parsed)) {
              // Garante que a data está sendo interpretada corretamente
              const year = parsed.getFullYear()
              const month = parsed.getMonth()
              const day = parsed.getDate()
              setCurrentValue(new Date(year, month, day))
            }
          } catch (e) {
            // Ignora erro de parse
          }
        } else if (mode === 'time') {
          const [hours, minutes] = value.split(':').map(Number)
          const date = new Date()
          date.setHours(hours || 0, minutes || 0, 0, 0)
          setCurrentValue(date)
        }
      }
    }
  }, [value, mode])

  const handleChange = (event: any, selectedValue?: Date) => {
    if (!selectedValue) return

    // Garante que a data está sendo interpretada corretamente
    // Cria uma nova data usando os componentes individuais para evitar confusão de timezone
    const year = selectedValue.getFullYear()
    const month = selectedValue.getMonth()
    const day = selectedValue.getDate()
    const correctDate = mode === 'date' ? new Date(year, month, day) : selectedValue

    if (Platform.OS === 'android') {
      if (event.type === 'set') {
        setCurrentValue(correctDate)
        if (mode === 'date') {
          onChange(format(correctDate, 'dd/MM/yyyy', { locale: ptBR }))
        } else if (mode === 'time') {
          onChange(format(selectedValue, 'HH:mm', { locale: ptBR }))
        } else {
          onChange(correctDate)
        }
      }
    } else {
      // iOS - atualiza imediatamente (inline)
      setCurrentValue(correctDate)
      if (mode === 'date') {
        onChange(format(correctDate, 'dd/MM/yyyy', { locale: ptBR }))
      } else if (mode === 'time') {
        onChange(format(selectedValue, 'HH:mm', { locale: ptBR }))
      } else {
        onChange(correctDate)
      }
    }
  }

  const getDisplayValue = () => {
    if (!value && !currentValue) return placeholder || (mode === 'date' ? 'DD/MM/AAAA' : 'HH:mm')
    
    const dateToFormat = value instanceof Date ? value : currentValue
    
    if (mode === 'date') {
      return format(dateToFormat, 'dd/MM/yyyy', { locale: ptBR })
    } else if (mode === 'time') {
      return format(dateToFormat, 'HH:mm', { locale: ptBR })
    }
    return format(dateToFormat, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const displayValue = getDisplayValue()
  const hasValue = !!(value || currentValue)
  const [showPicker, setShowPicker] = useState(false)

  // iOS: mostra picker inline quando clica no campo
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label || ''}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          <View style={styles.inputContainer}>
            <Text 
              style={[
                styles.displayText, 
                !hasValue && styles.placeholderText,
                !showPicker && styles.displayTextNoPicker
              ]}
              onPress={() => setShowPicker(!showPicker)}
            >
              {displayValue}
            </Text>
            {showPicker && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={currentValue}
                  mode={mode}
                  is24Hour={true}
                  display="inline"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  textColor={colors.text.primary}
                  themeVariant="light"
                  locale="pt_BR"
                  style={mode === 'time' ? styles.inlineTimePicker : styles.inlinePicker}
                />
              </View>
            )}
          </View>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    )
  }

  // Android: também usa inline para time, mantém dialog para date
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label || ''}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <View style={styles.inputContainer}>
          <Text 
            style={[
              styles.displayText, 
              !hasValue && styles.placeholderText,
              !showPicker && styles.displayTextNoPicker
            ]} 
            onPress={() => setShowPicker(!showPicker)}
          >
            {displayValue}
          </Text>
          {showPicker && mode === 'time' && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={currentValue}
                mode={mode}
                is24Hour={true}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={colors.text.primary}
                themeVariant="light"
                locale="pt_BR"
                style={styles.inlineTimePicker}
              />
            </View>
          )}
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {showPicker && mode === 'date' && (
        <DateTimePicker
          value={currentValue}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={(event, selectedValue) => {
            setShowPicker(false)
            handleChange(event, selectedValue)
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor={colors.text.primary}
          themeVariant="light"
          locale="pt_BR"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
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
    overflow: 'hidden',
  },
  inputContainer: {
    width: '100%',
  },
  displayText: {
    borderWidth: 0,
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  displayTextNoPicker: {
    paddingBottom: 16,
  },
  placeholderText: {
    color: colors.text.tertiary,
    includeFontPadding: false,
  },
  pickerWrapper: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inlinePicker: {
    width: Dimensions.get('window').width - 64, // Ajusta para o padding do container
    height: 216,
  },
  inlineTimePicker: {
    width: Dimensions.get('window').width - 64,
    height: 180,
  },
  inputError: {
    borderColor: colors.status.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
    color: colors.status.error,
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
})


import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import GlassCard from './GlassCard'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

interface TimePickerProps {
  value?: string // Formato HH:mm
  onChange: (time: string) => void
  placeholder?: string
}

export default function TimePicker({ value, onChange, placeholder = 'Selecionar horário' }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [tempTime, setTempTime] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number)
      const date = new Date()
      date.setHours(hours || 0, minutes || 0, 0, 0)
      return date
    }
    return new Date()
  })

  const handleConfirm = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
      if (event.type === 'set' && selectedTime) {
        const timeStr = format(selectedTime, 'HH:mm')
        onChange(timeStr)
      }
    } else {
      if (selectedTime) {
        setTempTime(selectedTime)
      }
    }
  }

  const handleIOSConfirm = () => {
    const timeStr = format(tempTime, 'HH:mm')
    onChange(timeStr)
    setShowPicker(false)
  }

  const displayValue = value || placeholder

  if (Platform.OS === 'android') {
    return (
      <View style={styles.inputWrapper}>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={[styles.inputText, !value && styles.placeholderText]}>{displayValue}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleConfirm}
            textColor={colors.text.primary}
            themeVariant="light"
          />
        )}
      </View>
    )
  }

  // iOS
  return (
    <View style={styles.inputWrapper}>
      <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={[styles.inputText, !value && styles.placeholderText]}>{displayValue}</Text>
      </TouchableOpacity>
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard opacity={0.45} blurIntensity={25} borderRadius={20} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)} activeOpacity={0.7}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Selecionar Horário</Text>
              <TouchableOpacity onPress={handleIOSConfirm} activeOpacity={0.7}>
                <Text style={styles.confirmButton}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setTempTime(selectedTime)
                  }
                }}
                style={styles.picker}
                textColor={colors.text.primary}
                themeVariant="light"
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
    backgroundColor: colors.glass.background,
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
  },
  inputText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    color: colors.text.primary,
    includeFontPadding: false,
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    color: colors.text.tertiary,
    includeFontPadding: false,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    marginHorizontal: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xl,
    color: colors.text.primary,
  },
  cancelButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    color: colors.text.secondary,
  },
  confirmButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    color: colors.gradients.primary[1],
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 8,
  },
  picker: {
    width: '100%',
    height: 200,
  },
})



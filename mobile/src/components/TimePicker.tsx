import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'

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
      <View>
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
          />
        )}
      </View>
    )
  }

  // iOS
  return (
    <View>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Selecionar Horário</Text>
              <TouchableOpacity onPress={handleIOSConfirm}>
                <Text style={styles.confirmButton}>Confirmar</Text>
              </TouchableOpacity>
            </View>
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
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    fontSize: 16,
    color: '#3366FF',
    fontWeight: '600',
  },
  picker: {
    width: '100%',
    height: 200,
  },
})


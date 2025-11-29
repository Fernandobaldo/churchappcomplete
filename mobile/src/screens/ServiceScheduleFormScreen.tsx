import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { serviceScheduleApi, ServiceSchedule, CreateServiceScheduleData } from '../api/serviceScheduleApi'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import PageHeader from '../components/PageHeader'

const DAYS_OF_WEEK = [
  { label: 'Domingo', value: 0 },
  { label: 'Segunda-feira', value: 1 },
  { label: 'Terça-feira', value: 2 },
  { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 },
  { label: 'Sexta-feira', value: 5 },
  { label: 'Sábado', value: 6 },
]

export default function ServiceScheduleFormScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { user } = useAuthStore()
  const schedule = route.params?.schedule as ServiceSchedule | null

  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [time, setTime] = useState('10:00')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [autoCreateEvents, setAutoCreateEvents] = useState(false)
  const [autoCreateDaysAhead, setAutoCreateDaysAhead] = useState('90')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (schedule) {
      setDayOfWeek(schedule.dayOfWeek)
      setTime(schedule.time)
      setTitle(schedule.title)
      setDescription(schedule.description || '')
      setLocation(schedule.location || '')
      setIsDefault(schedule.isDefault)
      setAutoCreateEvents(schedule.autoCreateEvents)
      setAutoCreateDaysAhead(String(schedule.autoCreateDaysAhead || 90))
    }
  }, [schedule])

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Título é obrigatório' })
      return
    }

    if (!user?.branchId) {
      Toast.show({ type: 'error', text1: 'Usuário não está associado a uma filial' })
      return
    }

    setSaving(true)
    try {
      const data: CreateServiceScheduleData = {
        branchId: user.branchId,
        dayOfWeek,
        time,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        isDefault,
        autoCreateEvents,
        autoCreateDaysAhead: autoCreateEvents ? parseInt(autoCreateDaysAhead) || 90 : undefined,
      }

      if (schedule) {
        const result = await serviceScheduleApi.update(schedule.id, data)
        if (result.updatedEventsCount && result.updatedEventsCount > 0) {
          Toast.show({
            type: 'success',
            text1: 'Horário atualizado com sucesso!',
            text2: `${result.updatedEventsCount} evento(s) relacionado(s) também foram atualizado(s).`,
          })
        } else {
          Toast.show({ type: 'success', text1: 'Horário atualizado com sucesso!' })
        }
      } else {
        await serviceScheduleApi.create(data)
        Toast.show({ type: 'success', text1: 'Horário criado com sucesso!' })
      }
      navigation.goBack()
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Erro ao salvar horário' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <PageHeader title={schedule ? 'Editar Horário' : 'Novo Horário'} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.label}>Dia da Semana *</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={dayOfWeek} onValueChange={setDayOfWeek} style={styles.picker}>
              {DAYS_OF_WEEK.map((day) => (
                <Picker.Item key={day.value} label={day.label} value={day.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Horário *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:mm"
            value={time}
            onChangeText={setTime}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Culto Dominical"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição opcional"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Localização</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Templo Principal"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Definir como horário padrão</Text>
            <Switch value={isDefault} onValueChange={setIsDefault} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Criar eventos automaticamente</Text>
            <Switch value={autoCreateEvents} onValueChange={setAutoCreateEvents} />
          </View>

          {autoCreateEvents && (
            <>
              <Text style={styles.label}>Dias à frente para criar eventos</Text>
              <TextInput
                style={styles.input}
                placeholder="90"
                value={autoCreateDaysAhead}
                onChangeText={setAutoCreateDaysAhead}
                keyboardType="numeric"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'Salvando...' : schedule ? 'Atualizar' : 'Criar'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#3366FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})


import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import ModalSelector from 'react-native-modal-selector'
import { format } from 'date-fns'
import { serviceScheduleApi, ServiceSchedule, CreateServiceScheduleData } from '../api/serviceScheduleApi'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import { colors } from '../theme/colors'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import DateTimePickerComponent from '../components/DateTimePicker'

const DAYS_OF_WEEK = [
  { key: '0', label: 'Domingo', value: '0' },
  { key: '1', label: 'Segunda-feira', value: '1' },
  { key: '2', label: 'Terça-feira', value: '2' },
  { key: '3', label: 'Quarta-feira', value: '3' },
  { key: '4', label: 'Quinta-feira', value: '4' },
  { key: '5', label: 'Sexta-feira', value: '5' },
  { key: '6', label: 'Sábado', value: '6' },
]

export default function ServiceScheduleFormScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { user } = useAuthStore()
  const schedule = (route.params as { schedule?: ServiceSchedule })?.schedule || null

  const [dayOfWeek, setDayOfWeek] = useState<number>(0)
  const [time, setTime] = useState('10:00')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
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
        location: location && location.trim() ? location.trim() : undefined,
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
    <FormScreenLayout
      headerProps={{ title: schedule ? 'Editar Horário' : 'Novo Horário' }}
    >
      <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.section}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Dia da Semana <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <ModalSelector
                data={DAYS_OF_WEEK}
                initValue={DAYS_OF_WEEK.find(d => d.value === String(dayOfWeek))?.label || 'Selecione o dia'}
                onChange={(option) => {
                  setDayOfWeek(parseInt(option.value as string, 10))
                }}
                style={styles.input}
                initValueTextStyle={{ 
                  color: dayOfWeek !== undefined ? colors.text.primary : colors.text.tertiary,
                  padding: 16,
                  fontSize: 16,
                  fontWeight: '400',
                }}
                selectTextStyle={{ padding: 12 }}
              >
                <TextInput
                  style={styles.input}
                  editable={false}
                  placeholder="Selecione o dia da semana"
                  value={DAYS_OF_WEEK.find(d => d.value === String(dayOfWeek))?.label || ''}
                  placeholderTextColor={colors.text.tertiary}
                />
              </ModalSelector>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <DateTimePickerComponent
              label="Horário"
              required
              value={time}
              onChange={(value) => setTime(typeof value === 'string' ? value : format(value, 'HH:mm'))}
              mode="time"
              placeholder="HH:mm"
            />
          </View>

          <TextInputField
            fieldKey="title"
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Culto Dominical"
            required
          />

          <TextInputField
            fieldKey="description"
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição opcional"
            multiline
          />

          <TextInputField
            fieldKey="location"
            label="Localização"
            value={location}
            onChangeText={setLocation}
            placeholder="Ex: Templo Principal"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Criar eventos automaticamente</Text>
            <Switch
              value={autoCreateEvents}
              onValueChange={setAutoCreateEvents}
              trackColor={{ false: '#CBD5E1', true: colors.gradients.primary[1] }}
              thumbColor={autoCreateEvents ? '#FFFFFF' : '#F1F5F9'}
              ios_backgroundColor="#CBD5E1"
            />
          </View>

          {autoCreateEvents && (
            <TextInputField
              fieldKey="autoCreateDaysAhead"
              label="Dias à frente para criar eventos"
              value={autoCreateDaysAhead}
              onChangeText={setAutoCreateDaysAhead}
              placeholder="90"
              keyboardType="numeric"
            />
          )}

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'Salvando...' : schedule ? 'Atualizar' : 'Criar'}</Text>
          </TouchableOpacity>
        </GlassCard>
    </FormScreenLayout>
  )
}

const styles = StyleSheet.create({
  section: {
    margin: 16,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: colors.status.error,
    fontWeight: 'bold',
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
    color: colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  button: {
    backgroundColor: colors.gradients.primary[1],
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    ...colors.shadow.glassLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})


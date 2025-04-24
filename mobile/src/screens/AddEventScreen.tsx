import React, { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet, Switch, Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../api/api'

export default function AddEventScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [date, setDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)

    const [time, setTime] = useState(new Date())
    const [showTimePicker, setShowTimePicker] = useState(false)

    const [location, setLocation] = useState('')
    const [hasContribution, setHasContribution] = useState(false)
    const [contributionReason, setContributionReason] = useState('')
    const [paymentLink, setPaymentLink] = useState('')

    const handleSubmit = async () => {
        const dateString = date.toISOString().split('T')[0]
        const timeString = time.toTimeString().slice(0, 5) // Ex: 19:30

        try {
            await api.post('/events', {
                title,
                date: dateString,
                time: timeString,
                location,
                hasDonation:hasContribution,
                contributionReason,
                paymentLink,
            })

            navigation.goBack()
        }  catch (err: any) {
            console.log('Erro ao salvar evento:', JSON.stringify(err.response?.data || err.message, null, 2))
            alert('Erro ao salvar evento')
        }
    }

    return (
        <View style={styles.container}>
            <Text>Título</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text>Data</Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text>{date.toLocaleDateString()}</Text>
            </Pressable>
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || date
                        setShowDatePicker(Platform.OS === 'ios') // no iOS permanece
                        setDate(currentDate)
                    }}
                />
            )}

            <Text>Hora</Text>
            <Pressable onPress={() => setShowTimePicker(true)} style={styles.input}>
                <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </Pressable>
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                        const currentTime = selectedTime || time
                        setShowTimePicker(Platform.OS === 'ios')
                        setTime(currentTime)
                    }}
                />
            )}

            <Text>Local</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} />

            <View style={styles.switchRow}>
                <Text>Contribuição habilitada?</Text>
                <Switch value={hasContribution} onValueChange={setHasContribution} />
            </View>

            {hasContribution && (
                <>
                    <Text>Motivo da contribuição</Text>
                    <TextInput style={styles.input} value={contributionReason} onChangeText={setContributionReason} />

                    <Text>Link de pagamento</Text>
                    <TextInput style={styles.input} value={paymentLink} onChangeText={setPaymentLink} />
                </>
            )}

            <Button title="Salvar Evento" onPress={handleSubmit} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 12,
        borderRadius: 8,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
})

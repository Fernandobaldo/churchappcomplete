import React, { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet, Switch } from 'react-native'
import api from '../api/api'

export default function AddEventScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')

    const [location, setLocation] = useState('')
    const [hasContribution, setHasContribution] = useState(false)
    const [contributionReason, setContributionReason] = useState('')
    const [paymentLink, setPaymentLink] = useState('')

    const handleSubmit = async () => {
        console.log('Tentando criar evento...')
        try {
        await api.post('/events', {
            title,
            date,
            time,
            location,
            hasDonation: hasContribution,
            donationReason: contributionReason,
            donationLink: paymentLink,
        })
        navigation.goBack()
    } catch (err: any) {
            console.error('Erro ao criar evento:', err?.response?.data || err.message)
            alert('Erro ao criar evento')
        }
    }

    return (
        <View style={styles.container}>
            <Text>Título</Text>
            <TextInput style={styles.input} onChangeText={setTitle} value={title} />

            <Text>Data (ISO ou YYYY-MM-DDTHH:mm)</Text>
            {/*<TextInput style={styles.input} onChangeText={setDate} value={date} />*/}
            <TextInput placeholder="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} />

            <Text>Time</Text>

            <TextInput placeholder="Hora (HH:MM)" value={time} onChangeText={setTime} style={styles.input} />

            <Text>Local</Text>
            <TextInput style={styles.input} onChangeText={setLocation} value={location} />

            <View style={styles.switchRow}>
                <Text>Contribuição habilitada?</Text>
                <Switch value={hasContribution} onValueChange={setHasContribution} />
            </View>

            {hasContribution && (
                <>
                    <Text>Motivo da contribuição</Text>
                    <TextInput style={styles.input} onChangeText={setContributionReason} value={contributionReason} />

                    <Text>Link de pagamento</Text>
                    <TextInput style={styles.input} onChangeText={setPaymentLink} value={paymentLink} />
                </>
            )}

            <Button title="Salvar Evento" onPress={handleSubmit} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 12 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
})

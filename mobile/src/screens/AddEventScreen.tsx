import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Modal,
    Pressable,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

export default function AddEventScreen() {
    const navigation = useNavigation()
    const [title, setTitle] = useState('')
    const [location, setLocation] = useState('')
    const [description, setDescription] = useState('')
    const [hasDonation, setHasDonation] = useState(false)
    const [donationReason, setDonationReason] = useState('')
    const [paymentLink, setPaymentLink] = useState('')

    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [time, setTime] = useState(new Date())

    const [showStartPicker, setShowStartPicker] = useState(false)
    const [showEndPicker, setShowEndPicker] = useState(false)

    const handleTimeChange = (event, selected) => {
        if (selected) setTime(selected)
    }

    const handleSave = async () => {
        if (!startDate || !endDate) return alert('Selecione data de início e término')
        try {
            const res = await api.post('/events', {
                title,
                location,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                time: time.toTimeString().slice(0, 5),
                hasDonation,
                donationReason,
                paymentLink,
            })

            Toast.show({
                type: 'success',
                text1: 'Evento criado!',
                text2: 'Seu evento foi adicionado com sucesso. 🎉',
            })


            navigation.goBack()
        } catch (res) {
            console.error('Erro ao salvar evento:', res.data)
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.form}>
                    <Text style={styles.title}>Adicionar / Editar Evento</Text>

                    <Text style={styles.label}>Título do evento</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite o título"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Data de início</Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
                        <Text>{startDate ? startDate.toLocaleDateString() : 'Selecionar data de início'}</Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selected) => {
                                setShowStartPicker(false)
                                if (selected) setStartDate(selected)
                            }}
                        />
                    )}

                    <Text style={styles.label}>Data de término</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
                        <Text>{endDate ? endDate.toLocaleDateString() : 'Selecionar data de término'}</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selected) => {
                                setShowEndPicker(false)
                                if (selected) setEndDate(selected)
                            }}
                        />
                    )}

                    <Text style={styles.label}>Hora</Text>
                    <DateTimePicker
                        value={time}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                    />

                    <Text style={styles.label}>Local</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite o local"
                        value={location}
                        onChangeText={setLocation}
                    />

                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="Informações adicionais sobre o evento"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Contribuição habilitada</Text>
                        <Switch value={hasDonation} onValueChange={setHasDonation} />
                    </View>

                    {hasDonation && (
                        <>
                            <Text style={styles.label}>Motivo da contribuição</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Apoio Missionário"
                                value={donationReason}
                                onChangeText={setDonationReason}
                            />

                            <Text style={styles.label}>Link do pagamento</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://exemplo.com/pagamento"
                                value={paymentLink}
                                onChangeText={setPaymentLink}
                            />
                        </>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    form: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, marginTop: 45 },
    label: { marginTop: 16, marginBottom: 2, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    cancelButton: {
        backgroundColor: '#eee',
        padding: 14,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelText: { color: '#333' },
    saveButton: {
        backgroundColor: '#3366FF',
        padding: 14,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: 'bold' },
})

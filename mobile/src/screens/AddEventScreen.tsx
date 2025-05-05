import React, { useState } from 'react'
import {
    View,
    StyleSheet,
} from 'react-native'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import PageHeader from "../components/PageHeader";
import MemberForm from "../components/FormsComponent";

export default function AddEventScreen() {
    const navigation = useNavigation()

    const [form, setForm] = useState({
        title: '',
        startDate: '',
        endDate: '',
        time: '',
        description: '',
        location: '',
        hasDonation: ''
    })

    const fields = [
        { key: 'title', label: 'Titulo do evento', type: 'string' },
        { key: 'startDate', label: 'Data de início', type: 'date' },
        { key: 'endDate', label: 'Data do término', type: 'date' },
        { key: 'time', label: 'Horario', type: 'string' },
        { key: 'description', label: 'Descrição', type: 'string' },
        { key: 'location', label: 'Localização', type: 'string' },
        { key: 'hasDonation', label: 'Contribuição habilitada', type: 'toggle' },
        {
            key: 'donationReason',
            label: 'Motivo da contribuição',
            placeholder: 'Apoio Missionário',
            type: 'string',
            dependsOn: 'hasDonation',
        },
        {
            key: 'paymentLink',
            label: 'Link do pagamento',
            placeholder: 'https://exemplo.com/pagamento',
            type: 'string',
            dependsOn: 'hasDonation',
        },
    ]

    const convertToISO = (dateStr: string) => {
        if (!dateStr) return null
        const [day, month, year] = dateStr.split('/')
        return new Date(+year, +month - 1, +day).toISOString()
    }

    const handleSave = async () => {

        try {
            const res = await api.post('/events', {
                ...form,
                startDate: convertToISO(form.startDate),
                endDate: form.endDate ? convertToISO(form.endDate) : undefined, // ou null, se o backend aceitar
            })
            Toast.show({
                type: 'success',
                text1: 'Evento criado!',
                text2: 'Seu evento foi adicionado com sucesso. 🎉',
            })


            navigation.goBack()
        } catch (res) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar evento',
                text2: 'Houve um erro ao salvar o evento',
            })
            console.error('Erro ao salvar evento:', res.data)
        }
    }

    return (

        <View style={styles.container}>
            <PageHeader
                title="Editar Perfil"
                Icon={FontAwesome5}
                iconName="user"
            />
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSave}
                submitLabel="Salvar alterações"
            />
                </View>
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

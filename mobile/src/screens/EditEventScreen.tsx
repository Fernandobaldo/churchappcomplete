import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import PageHeader from '../components/PageHeader'
import MemberForm from '../components/FormsComponent'
import api from '../api/api'
import { parse, format, isValid } from 'date-fns'

export default function EditEventScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params as { id: string }

    const [form, setForm] = useState({
        title: '',
        startDate: '',
        endDate: '',
        time: '',
        description: '',
        location: '',
        hasDonation: false,
        donationReason: '',
        donationLink: '',
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
            key: 'donationLink',
            label: 'Link do pagamento',
            placeholder: 'https://exemplo.com/pagamento',
            type: 'string',
            dependsOn: 'hasDonation',
        },
    ]

    const convertToFormattedDate = (dateStr: string) => {
        if (!dateStr) return undefined
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date())
        if (!isValid(parsedDate)) return undefined
        return format(parsedDate, 'dd-MM-yyyy')
    }

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${id}`)
            const e = res.data

            setForm({
                title: e.title || '',
                startDate: e.startDate ? format(new Date(e.startDate), 'dd/MM/yyyy') : '',
                endDate: e.endDate ? format(new Date(e.endDate), 'dd/MM/yyyy') : '',
                time: e.time || '',
                description: e.description || '',
                location: e.location || '',
                hasDonation: e.hasDonation || false,
                donationReason: e.donationReason || '',
                donationLink: e.donationLink || '', // adaptando o nome do campo
            })
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao carregar evento',
                text2: 'Não foi possível carregar os dados do evento.',
            })

        }
    }

    useEffect(() => {
        fetchEvent()
    }, [id])

    const handleUpdate = async () => {
        const payload = {
            ...form,
            startDate: convertToFormattedDate(form.startDate),
            endDate: convertToFormattedDate(form.endDate),
            donationLink: form.donationLink, // adaptando de volta para o nome esperado pela API
        }

        try {
            await api.put(`/events/${id}`, payload)
            Toast.show({
                type: 'success',
                text1: 'Evento atualizado!',
                text2: 'As alterações foram salvas com sucesso. 🎉',
            })
            navigation.goBack()
        } catch (res) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao atualizar evento',
                text2: 'Houve um erro ao salvar as alterações.',
            })
            console.error('Erro ao atualizar evento:', res)
        }
    }

    return (
        <View style={styles.container}>
            <PageHeader title="Editar Evento" Icon={FontAwesome5} iconName="edit" />
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleUpdate}
                submitLabel="Salvar alterações"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
})

import React, { useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
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
        time: '',
        description: '',
        location: '',
        hasDonation: false,
        donationReason: '',
        donationLink: '',
        imageUrl: '',
    })

    const fields = [
        { key: 'title', label: 'Título do evento', type: 'string', required: true, placeholder: 'Ex: Culto Dominical' },
        { key: 'startDate', label: 'Data do evento', type: 'date', required: true, placeholder: 'DD/MM/AAAA' },
        { key: 'time', label: 'Horário', type: 'time', placeholder: 'HH:mm' },
        { key: 'description', label: 'Descrição', type: 'string', placeholder: 'Descrição do evento' },
        { key: 'location', label: 'Localização', type: 'string', placeholder: 'Ex: Templo Principal' },
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
        {
            key: 'imageUrl',
            label: 'Banner do evento',
            type: 'image',
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

            // Combina startDate com time para preencher o campo time corretamente
            let timeValue = e.time || ''
            if (e.startDate && !timeValue) {
                // Se não houver time separado, extrai do startDate
                const startDate = new Date(e.startDate)
                const hours = String(startDate.getHours()).padStart(2, '0')
                const minutes = String(startDate.getMinutes()).padStart(2, '0')
                timeValue = `${hours}:${minutes}`
            }

            setForm({
                title: e.title || '',
                startDate: e.startDate ? format(new Date(e.startDate), 'dd/MM/yyyy') : '',
                time: timeValue,
                description: e.description || '',
                location: e.location || '',
                hasDonation: e.hasDonation || false,
                donationReason: e.donationReason || '',
                donationLink: e.donationLink || '',
                imageUrl: e.imageUrl || '',
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
        // Validação de campos obrigatórios
        if (!form.title || !form.startDate) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        // Combina startDate com time se ambos estiverem presentes
        let finalStartDate = convertToFormattedDate(form.startDate)
        if (form.startDate && form.time) {
            const [hours, minutes] = form.time.split(':').map(Number)
            const startDate = parse(form.startDate, 'dd/MM/yyyy', new Date())
            if (isValid(startDate)) {
                startDate.setHours(hours || 0, minutes || 0, 0, 0)
                finalStartDate = format(startDate, 'dd-MM-yyyy')
            }
        }

        const payload = {
            ...form,
            startDate: finalStartDate,
            endDate: finalStartDate, // Usa a mesma data de início como término
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
        <FormScreenLayout
            headerProps={{
                title: "Editar Evento",
                Icon: FontAwesome5,
                iconName: "calendar"
            }}
        >
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleUpdate}
                submitLabel="Salvar alterações"
            />
        </FormScreenLayout>
    )
}

// Estilos removidos - agora gerenciados pelo FormScreenLayout

import React, { useState } from 'react'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import MemberForm from "../components/FormsComponent";
import {format, isValid, parse} from 'date-fns'

export default function AddEventScreen() {
    const navigation = useNavigation()

    const [form, setForm] = useState({
        title: '',
        startDate: '',
        time: '',
        description: '',
        location: '',
        hasDonation: false
    })

    const fields = [
        { key: 'title', label: 'Título do evento', type: 'string' as const, required: true, placeholder: 'Ex: Culto Dominical' },
        { key: 'startDate', label: 'Data do evento', type: 'date' as const, required: true, placeholder: 'DD/MM/AAAA' },
        { key: 'time', label: 'Horário', type: 'time' as const, placeholder: 'HH:mm' },
        { key: 'description', label: 'Descrição', type: 'string' as const, placeholder: 'Descrição do evento' },
        { key: 'location', label: 'Localização', type: 'string' as const, placeholder: 'Ex: Templo Principal' },
        { key: 'hasDonation', label: 'Contribuição habilitada', type: 'toggle' as const },
        {
            key: 'donationReason',
            label: 'Motivo da contribuição',
            placeholder: 'Apoio Missionário',
            type: 'string' as const,
            dependsOn: 'hasDonation',
        },
        {
            key: 'paymentLink',
            label: 'Link do pagamento',
            placeholder: 'https://exemplo.com/pagamento',
            type: 'string' as const,
            dependsOn: 'hasDonation',
        },
        {
            key: 'imageUrl',
            label: 'Banner do evento',
            type: 'image' as const,
        }
    ]


    const convertToFormattedDate = (dateStr: string) => {
        if (!dateStr) return undefined;

        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        if (!isValid(parsedDate)) {
            console.error('Data inválida enviada:', dateStr);
            return undefined;
        }

        return format(parsedDate, 'dd-MM-yyyy');
    }

    const handleSave = async () => {
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
        };
        try {

            console.log('Payload a ser enviado:', payload); // <-- VERIFIQUE AQUI

            await api.post('/events', payload);

            Toast.show({
                type: 'success',
                text1: 'Evento criado!',
                text2: 'Seu evento foi adicionado com sucesso. 🎉',
            })


            navigation.goBack()
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar evento',
                text2: 'Houve um erro ao salvar o evento',
            })
            console.error('Erro ao salvar evento:', error?.response?.data || error)
        }
    }

    return (
        <FormScreenLayout
            headerProps={{
                title: "Criar Evento",
                Icon: FontAwesome5,
                iconName: "calendar"
            }}
        >
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSave}
                submitLabel="Salvar alterações"
            />
        </FormScreenLayout>
    )
}

// Estilos removidos - agora gerenciados pelo FormScreenLayout

import React, { useState, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent from '../components/FormsComponent'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

export default function AddNoticeScreen() {
    const navigation = useNavigation()
    
    const [form, setForm] = useState({
        title: '',
        message: '',
    })

    const fields = useMemo(() => [
        { 
            key: 'title', 
            label: 'Título', 
            type: 'string' as const, 
            required: true, 
            placeholder: 'Ex: Reunião de oração' 
        },
        { 
            key: 'message', 
            label: 'Mensagem', 
            type: 'string' as const, 
            required: true, 
            placeholder: 'Escreva a mensagem do aviso aqui...' 
        },
    ], [])

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        try {
            await api.post('/notices', { 
                title: form.title.trim(), 
                message: form.message.trim() 
            })
            Toast.show({
                type: 'success',
                text1: 'Aviso publicado!',
                text2: 'Seu aviso foi publicado com sucesso.',
            })
            navigation.goBack()
        } catch (error: any) {
            console.error('Erro ao publicar aviso:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro ao publicar',
                text2: error.response?.data?.message || 'Ocorreu um erro ao publicar o aviso.',
            })
        }
    }

    return (
        <FormScreenLayout
            headerProps={{
                title: "Publicar Aviso",
                Icon: FontAwesome5,
                iconName: "bullhorn"
            }}
        >
            <FormsComponent
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSubmit}
                submitLabel="Publicar"
            />
        </FormScreenLayout>
    )
}

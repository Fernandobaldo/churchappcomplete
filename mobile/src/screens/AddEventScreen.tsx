import React, { useState, useMemo } from 'react'
import { Platform } from 'react-native'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import MemberForm from "../components/FormsComponent";
import {format, isValid, parse} from 'date-fns'
import { useAuthStore } from '../stores/authStore'

export default function AddEventScreen() {
    const navigation = useNavigation()

    const [form, setForm] = useState({
        title: '',
        startDate: '',
        time: '',
        description: '',
        location: '',
        imageUrl: '',
    })

    const fields = useMemo(() => [
        { key: 'title', label: 'Título do evento', type: 'string' as const, required: true, placeholder: 'Ex: Culto Dominical' },
        { key: 'startDate', label: 'Data do evento', type: 'date' as const, required: true, placeholder: 'DD/MM/AAAA' },
        { key: 'time', label: 'Horário', type: 'time' as const, placeholder: 'HH:mm' },
        { key: 'description', label: 'Descrição', type: 'string' as const, placeholder: 'Descrição do evento' },
        { key: 'location', label: 'Localização', type: 'string' as const, placeholder: 'Ex: Templo Principal' },
        {
            key: 'imageUrl',
            label: 'Banner do evento',
            type: 'image' as const,
        }
    ], [])


    const convertToFormattedDate = (dateStr: string) => {
        if (!dateStr) return undefined;

        // Garante que está parseando no formato correto DD/MM/YYYY
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        if (!isValid(parsedDate)) {
            console.error('Data inválida enviada:', dateStr);
            return undefined;
        }

        // Extrai os componentes da data para garantir que não há confusão
        const day = parsedDate.getDate()
        const month = parsedDate.getMonth() // getMonth() retorna 0-11
        const year = parsedDate.getFullYear()

        // Formata usando os componentes individuais para garantir formato correto
        const formatted = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`
        
        console.log('Data original:', dateStr, '→ Parsed:', parsedDate, '→ Formatada:', formatted)
        
        return formatted
    }

    const uploadImage = async (imageUri: string): Promise<string | undefined> => {
        try {
            // Verifica se é uma URI local (file://) que precisa ser enviada
            if (!imageUri || (!imageUri.startsWith('file://') && !imageUri.startsWith('http://') && !imageUri.startsWith('https://'))) {
                return imageUri // Já é uma URL válida ou está vazia
            }

            // Se já é uma URL http/https, retorna como está
            if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
                return imageUri
            }

            // Para URIs locais (file://), faz upload
            const token = useAuthStore.getState().token
            if (!token) {
                throw new Error('Token de autenticação não encontrado')
            }
            
            const formData = new FormData()
            
            // Adiciona o arquivo ao FormData
            // No React Native, o FormData aceita objetos com uri, type e name
            // @ts-ignore - React Native FormData aceita este formato
            formData.append('file', {
                uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                type: 'image/jpeg',
                name: 'event-image.jpg',
            } as any)

            const baseURL = api.defaults.baseURL
            const response = await fetch(`${baseURL}/upload/event-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Não definir Content-Type - o fetch fará isso automaticamente com boundary
                },
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
                throw new Error(errorData.error || 'Erro ao fazer upload da imagem')
            }

            const data = await response.json()
            return data.url // Retorna a URL relativa (/uploads/avatars/...)
        } catch (error: any) {
            console.error('Erro ao fazer upload da imagem:', error)
            throw error
        }
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

        try {
            // Faz upload da imagem se houver
            let imageUrl: string | undefined = form.imageUrl || undefined
            if (form.imageUrl && form.imageUrl.startsWith('file://')) {
                try {
                    imageUrl = await uploadImage(form.imageUrl)
                } catch (uploadError: any) {
                    Toast.show({
                        type: 'error',
                        text1: 'Erro ao fazer upload',
                        text2: uploadError.message || 'Não foi possível fazer upload da imagem',
                    })
                    return
                }
            }

            const payload: any = {
                ...form,
                startDate: finalStartDate,
                endDate: finalStartDate, // Usa a mesma data de início como término
            }

            // Adiciona imageUrl apenas se não estiver vazio
            if (imageUrl) {
                payload.imageUrl = imageUrl
            }

            console.log('Payload a ser enviado:', payload)

            await api.post('/events', payload)

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
                text2: error?.response?.data?.message || 'Houve um erro ao salvar o evento',
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

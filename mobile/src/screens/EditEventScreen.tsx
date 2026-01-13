import React, { useEffect, useState } from 'react'
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native'
import { Platform, Alert, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Toast from 'react-native-toast-message'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import MemberForm from '../components/FormsComponent'
import { eventsService } from '../services/events.service'
import { parse, format, isValid } from 'date-fns'
import { useAuthStore } from '../stores/authStore'

export default function EditEventScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params as { id: string }

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState({
        title: '',
        startDate: '',
        time: '',
        description: '',
        location: '',
        imageUrl: '',
    })

    const fields = [
        { key: 'title', label: 'Título do evento', type: 'string', required: true, placeholder: 'Ex: Culto Dominical' },
        { key: 'startDate', label: 'Data do evento', type: 'date', required: true, placeholder: 'DD/MM/AAAA' },
        { key: 'time', label: 'Horário', type: 'time', placeholder: 'HH:mm' },
        { key: 'description', label: 'Descrição', type: 'string', placeholder: 'Descrição do evento' },
        { key: 'location', label: 'Localização', type: 'string', placeholder: 'Ex: Templo Principal' },
        {
            key: 'imageUrl',
            label: 'Banner do evento',
            type: 'image',
        },
    ]

    const convertToFormattedDate = (dateStr: string) => {
        if (!dateStr) return undefined

        // Garante que está parseando no formato correto DD/MM/YYYY
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date())
        if (!isValid(parsedDate)) {
            console.error('Data inválida enviada:', dateStr)
            return undefined
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

    const fetchEvent = async () => {
        try {
            setLoading(true)
            setError(null)
            const e = await eventsService.getById(id)

            // Combina startDate com time para preencher o campo time corretamente
            let timeValue = e.time || ''
            if (e.startDate && !timeValue) {
                // Se não houver time separado, extrai do startDate
                const startDate = new Date(e.startDate)
                const hours = String(startDate.getHours()).padStart(2, '0')
                const minutes = String(startDate.getMinutes()).padStart(2, '0')
                timeValue = `${hours}:${minutes}`
            }

            // Constrói URL completa da imagem se necessário
            let imageUrl = e.imageUrl || ''
            if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                // URL relativa, adicionar baseURL
                const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
                // Importar api apenas para baseURL se necessário, ou usar constante
                const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
                imageUrl = `${baseURL}/${cleanUrl}`
            }

            setForm({
                title: e.title || '',
                startDate: e.startDate ? format(new Date(e.startDate), 'dd/MM/yyyy') : '',
                time: timeValue,
                description: e.description || '',
                location: e.location || '',
                imageUrl: imageUrl,
            })
        } catch (err: any) {
            console.error('Erro ao carregar evento:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar os dados do evento.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvent()
    }, [id])

    const handleRetry = async () => {
        await fetchEvent()
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

            const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333'
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
            return data.url // Retorna a URL relativa (/uploads/event-images/...)
        } catch (error: any) {
            console.error('Erro ao fazer upload da imagem:', error)
            throw error
        }
    }

    const handleDelete = async () => {
        Alert.alert(
            'Excluir Evento',
            'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eventsService.delete(id)
                            Toast.show({
                                type: 'success',
                                text1: 'Evento excluído!',
                                text2: 'O evento foi excluído com sucesso.',
                            })
                            // Reset para Main (TabNavigator) com tab Agenda selecionada
                            // Isso limpa o histórico e mantém o navbar visível
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: 'Main',
                                            state: {
                                                routes: [{ name: 'Agenda' }],
                                            },
                                        },
                                    ],
                                })
                            )
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Erro ao excluir evento',
                                text2: error?.response?.data?.message || 'Houve um erro ao excluir o evento.',
                            })
                            console.error('Erro ao excluir evento:', error)
                        }
                    },
                },
            ]
        )
    }

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

        try {
            // Faz upload da imagem se houver e for URI local
            let finalImageUrl: string | undefined = form.imageUrl || undefined
            if (form.imageUrl && form.imageUrl.startsWith('file://')) {
                try {
                    finalImageUrl = await uploadImage(form.imageUrl)
                } catch (uploadError: any) {
                    Toast.show({
                        type: 'error',
                        text1: 'Erro ao fazer upload',
                        text2: uploadError.message || 'Não foi possível fazer upload da imagem',
                    })
                    return
                }
            } else if (form.imageUrl && (form.imageUrl.startsWith('http://') || form.imageUrl.startsWith('https://'))) {
                // Se é URL completa, extrai apenas o caminho relativo se necessário
                // O backend espera URL relativa ou completa
                finalImageUrl = form.imageUrl
            }

            const payload: any = {
                title: form.title,
                startDate: finalStartDate,
                endDate: finalStartDate, // Usa a mesma data de início como término
                time: form.time,
                description: form.description,
                location: form.location,
            }

            // Adiciona imageUrl apenas se houver valor
            if (finalImageUrl !== undefined) {
                payload.imageUrl = finalImageUrl
            }

            await eventsService.update(id, payload)
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
            loading={loading}
            error={error}
            onRetry={handleRetry}
        >
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleUpdate}
                submitLabel="Salvar alterações"
            />
            
            <View style={styles.deleteContainer}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                >
                    <FontAwesome5 name="trash" size={16} color="#fff" />
                    <Text style={styles.deleteButtonText}>Excluir Evento</Text>
                </TouchableOpacity>
            </View>
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    deleteContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

// Estilos removidos - agora gerenciados pelo FormScreenLayout

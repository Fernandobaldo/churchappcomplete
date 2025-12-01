import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

export default function AddNoticeScreen() {
    const navigation = useNavigation()
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        // Validação de campos obrigatórios
        if (!title.trim() || !message.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        setIsLoading(true)
        try {
            await api.post('/notices', { title: title.trim(), message: message.trim() })
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
        } finally {
            setIsLoading(false)
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
            <View style={styles.form}>
                <Text style={styles.label}>
                    Título <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex: Reunião de oração"
                    placeholderTextColor="#999"
                    autoCapitalize="sentences"
                />

                <Text style={styles.label}>
                    Mensagem <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                    placeholder="Escreva a mensagem do aviso aqui..."
                    placeholderTextColor="#999"
                    textAlignVertical="top"
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                    >
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveText}>Publicar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    form: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    required: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#eee',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: {
        color: '#333',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#3366FF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
})

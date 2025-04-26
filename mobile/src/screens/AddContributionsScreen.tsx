import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import ModalSelector from 'react-native-modal-selector'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

export default function AddContributionScreen() {
    const navigation = useNavigation()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [value, setValue] = useState('')
    const [date, setDate] = useState(new Date())
    const [type, setType] = useState('')
    const [typeOptions, setTypeOptions] = useState([])

    const [showDatePicker, setShowDatePicker] = useState(false)
    const [tempDate, setTempDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function fetchTypes() {
            try {
                const res = await api.get('/contributions/types')
                const types = res.data || []
                setTypeOptions(types.map((option) => ({
                    key: option.value,
                    label: option.label,
                    value: option.value,
                })))
                if (types.length > 0) {
                    setType(types[0].value)
                }
            } catch (error) {
                console.error('Erro ao buscar tipos:', error)
            }
        }
        fetchTypes()
    }, [])

    const handleSave = async () => {
        if (!value || isNaN(parseFloat(value))) {
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Por favor, preencha um valor válido.',
            })
            return
        }

        try {
            setIsLoading(true)

            await api.post('/contributions', {
                title,
                description,
                date: date.toISOString().split('T')[0],
                type,
                value: parseFloat(value.replace(',', '.')),
            })

            Toast.show({
                type: 'success',
                text1: 'Sucesso!',
                text2: 'Contribuição salva com sucesso!',
            })

            navigation.goBack()

        } catch (error) {
            console.error('Erro ao salvar contribuição:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Ocorreu um erro ao salvar a contribuição.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.form}>
                    <Text style={styles.title}>Adicionar Contribuição</Text>

                    <Text style={styles.label}>Título</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Dízimo de abril"
                    />

                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder="Descrição opcional"
                    />

                    <Text style={styles.label}>Valor</Text>
                    <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="numeric"
                        placeholder="R$ 0,00"
                    />

                    <Text style={styles.label}>Data</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => {
                            setTempDate(date)
                            setShowDatePicker(true)
                        }}
                    >
                        <Text>{date ? date.toLocaleDateString('pt-BR') : 'Selecione a data'}</Text>
                    </TouchableOpacity>

                    <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setTempDate(selectedDate)
                                        }
                                    }}
                                    style={{ width: '100%', height: 150 }}
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowDatePicker(false)}
                                    >
                                        <Text style={styles.cancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={() => {
                                            setDate(tempDate)
                                            setShowDatePicker(false)
                                        }}
                                    >
                                        <Text style={styles.saveText}>Confirmar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Text style={styles.label}>Tipo de Contribuição</Text>
                    <ModalSelector
                        data={typeOptions}
                        initValue="Selecione o tipo"
                        onChange={(option) => {
                            setType(option.value)
                        }}
                        style={styles.input}
                        initValueTextStyle={{ color: '#999' }}
                        selectTextStyle={{ padding: 10 }}
                    >
                        <Text style={{ padding: 10 }}>
                            {typeOptions.find(opt => opt.value === type)?.label || 'Selecione o tipo'}
                        </Text>
                    </ModalSelector>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, isLoading && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>Salvar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    form: { padding: 20, flexGrow: 1 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    label: { marginTop: 16, marginBottom: 6, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center',
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
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
    cancelText: { color: '#333' },
    saveButton: {
        flex: 1,
        backgroundColor: '#3366FF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: 'bold' },
})

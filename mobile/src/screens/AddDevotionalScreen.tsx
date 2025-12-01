import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Platform,
    StyleSheet,
    Modal,
    ActivityIndicator,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons'; // para ícone de seta
import api from '../api/api'
import { bookTranslation } from '../utils/translateBooks'


export default function AddDevotionalScreen() {
    const navigation = useNavigation()

    const [title, setTitle] = useState('')
    const [selectedBook, setSelectedBook] = useState('')
    const [chapter, setChapter] = useState('')
    const [verse, setVerse] = useState('')
    const [content, setContent] = useState('')
    const [date, setDate] = useState(new Date())
    const [tempDate, setTempDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const booksOptions = Object.keys(bookTranslation).map((book) => ({
        label: book,
        value: book,
    }))

    const handleSave = async () => {
        // Validação de campos obrigatórios (title e passage são obrigatórios no backend)
        if (!title || !selectedBook || !chapter || !verse) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        const passage = `${selectedBook} ${chapter}:${verse}` // monta a passagem correta

        try {
            setIsLoading(true)

            await api.post('/devotionals', {
                title,
                passage,
                content,

            })

            Toast.show({
                type: 'success',
                text1: 'Devocional criado!',
                text2: 'Seu devocional foi adicionado com sucesso. 🙏',
            })

            navigation.goBack()

        } catch (error) {
            console.error('Erro ao salvar devocional:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Ocorreu um erro ao salvar o devocional.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.form}>
                    <Text style={styles.title}>Adicionar Devocional</Text>

                    <Text style={styles.label}>
                        Título <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Tema do dia"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>
                        Livro <Text style={styles.required}>*</Text>
                    </Text>
                    <RNPickerSelect
                        onValueChange={(value) => setSelectedBook(value)}
                        value={selectedBook}
                        items={Object.keys(bookTranslation).map((book) => ({
                            label: book,
                            value: book,
                        }))}
                        placeholder={{ label: 'Selecione o livro', value: '' }}
                        style={{
                            inputIOS: styles.inputBook,
                            inputAndroid: styles.inputBook,
                            placeholder: {
                                color: '#999',
                            },
                            iconContainer: {
                                top: 18,
                                right: 10,
                            },
                        }}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => (
                            <Ionicons name="chevron-down" size={20} color="gray" />
                        )}
                    />

                    <Text style={styles.label}>
                        Capítulo <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={chapter}
                        onChangeText={setChapter}
                        placeholder="Número do capítulo"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>
                        Versículo <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={verse}
                        onChangeText={setVerse}
                        placeholder="Número do versículo"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Conteúdo</Text>
                    <TextInput
                        style={[styles.input, { height: 150 }]}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        placeholder="Escreva o devocional aqui..."
                        placeholderTextColor="#999"
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Data</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => {
                            setTempDate(date)
                            setShowDatePicker(true)
                        }}
                    >
                        <Text style={date ? { color: '#333' } : { color: '#999' }}>
                            {date ? date.toLocaleDateString('pt-BR') : 'DD/MM/AAAA'}
                        </Text>
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
                                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
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
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 , marginTop: 45},
    label: { marginTop: 16, marginBottom: 1, fontWeight: '600', color: '#333' },
    required: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center',
        marginBottom: 10,
        backgroundColor: '#fff',
        fontSize: 16,
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
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
    },
    inputBook: {
        height: 50,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        color: '#333',
        marginBottom: 10,
    },


})

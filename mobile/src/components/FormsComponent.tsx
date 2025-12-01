// components/FormsComponent.tsx

import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    Switch,
    TouchableOpacity,
    StyleSheet,
    KeyboardTypeOptions,
    Image, Platform, Keyboard,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { format } from 'date-fns'
import {useNavigation} from "@react-navigation/native"
import ModalSelector from 'react-native-modal-selector'
import TimePicker from './TimePicker'

type SelectOption = {
    key: string
    label: string
    value: string
}

type Field = {
    key: string
    label: string
    placeholder?: string
    secure?: boolean
    required?: boolean
    type?: 'string' | 'number' | 'email' | 'password' | 'date' | 'time' | 'image' | 'toggle' | 'select'
    dependsOn?: string // opcional: define de qual campo booleano o campo depende
    options?: SelectOption[] // opções para tipo select
    error?: string // mensagem de erro para validação
}

type MemberFormProps = {
    form: any
    setForm: React.Dispatch<React.SetStateAction<any>>
    fields: Field[]
    onSubmit: () => void
    submitLabel?: string
}

export default function FormsComponent({
                                           form,
                                           setForm,
                                           fields,
                                           onSubmit,
                                           submitLabel = 'Salvar',
                                       }: MemberFormProps) {
    const [isDatePickerVisible, setDatePickerVisible] = useState(false)
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const navigation = useNavigation()

    const showDatePicker = (key: string) => {
        setActiveDateKey(key)
        // Se já existe uma data no form, usa ela, senão usa a data atual
        if (form[key]) {
            try {
                const parsedDate = new Date(form[key].split('/').reverse().join('-'))
                if (!isNaN(parsedDate.getTime())) {
                    setSelectedDate(parsedDate)
                } else {
                    setSelectedDate(new Date())
                }
            } catch {
                setSelectedDate(new Date())
            }
        } else {
            setSelectedDate(new Date())
        }
        setDatePickerVisible(true)
    }

    const hideDatePicker = () => {
        setDatePickerVisible(false)
        setActiveDateKey(null)
    }

    const handleConfirm = (date: Date) => {
        if (activeDateKey) {
            setForm((prev) => ({ ...prev, [activeDateKey]: format(date, 'dd/MM/yyyy') }))
        }
        hideDatePicker()
    }

    const handleSelectImage = async (key: string) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permissionResult.granted) {
            alert('Permissão de acesso à galeria é necessária.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        })

        if (!result.canceled && result.assets?.[0]?.uri) {
            setForm((prev) => ({ ...prev, [key]: result.assets[0].uri }))
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
            {fields.map((field) => {
                // Verifica dependências
                if (field.dependsOn && !form[field.dependsOn]) return null

                // Renderiza label com indicador de obrigatório
                const renderLabel = () => (
                    <Text style={styles.label}>
                        {field.label}
                        {field.required && <Text style={styles.required}> *</Text>}
                    </Text>
                )

                // Determina estilo do input baseado em erro
                const getInputStyle = (baseStyle: any) => [
                    baseStyle,
                    field.error && styles.inputError
                ]

                if (field.type === 'date') {
                    return (
                        <View key={field.key}>
                            {renderLabel()}
                            <TouchableOpacity
                                style={getInputStyle(styles.input)}
                                onPress={() => showDatePicker(field.key)}
                            >
                                <Text style={form[field.key] ? styles.inputText : styles.placeholderText}>
                                    {form[field.key] || field.placeholder || 'DD/MM/AAAA'}
                                </Text>
                            </TouchableOpacity>
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }

                if (field.type === 'time') {
                    return (
                        <View key={field.key}>
                            {renderLabel()}
                            <TimePicker
                                value={form[field.key]}
                                onChange={(time) => setForm((prev) => ({ ...prev, [field.key]: time }))}
                                placeholder={field.placeholder || 'HH:mm'}
                            />
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }

                if (field.type === 'image') {
                    const imageKey = field.key === 'avatar' ? 'avatar' : field.key
                    return (
                        <View key={field.key} style={{alignItems: 'center'}}>
                            {renderLabel()}
                            {form[field.key] ? (
                                <Image source={{uri: form[field.key]}} style={styles.imagePreview}/>
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={{color: '#888'}}>Nenhuma imagem</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.buttonSmall}
                                onPress={() => handleSelectImage(field.key)}
                            >
                                <Text style={styles.buttonText}>Selecionar Imagem</Text>
                            </TouchableOpacity>
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }

                if (field.type === 'toggle') {
                    return (
                        <View key={field.key} style={styles.switchRow}>
                            {renderLabel()}
                            <Switch
                                value={!!form[field.key]}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, [field.key]: value }))
                                }
                            />
                        </View>
                    )
                }

                if (field.type === 'select') {
                    const selectedOption = field.options?.find(opt => opt.value === form[field.key])
                    return (
                        <View key={field.key}>
                            {renderLabel()}
                            <ModalSelector
                                data={field.options || []}
                                initValue={selectedOption?.label || field.placeholder || 'Selecione uma opção'}
                                onChange={(option) => {
                                    setForm((prev) => ({ ...prev, [field.key]: option.value }))
                                }}
                                style={getInputStyle(styles.input)}
                                initValueTextStyle={{ color: form[field.key] ? '#333' : '#999' }}
                                selectTextStyle={{ padding: 12 }}
                            >
                                <TextInput
                                    style={getInputStyle(styles.input)}
                                    editable={false}
                                    placeholder={field.placeholder || 'Selecione uma opção'}
                                    value={selectedOption?.label || ''}
                                    placeholderTextColor="#999"
                                />
                            </ModalSelector>
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }


                const keyboardType: KeyboardTypeOptions =
                    field.type === 'number'
                        ? 'numeric'
                        : field.type === 'email'
                            ? 'email-address'
                            : 'default'

                const secure = field.type === 'password' || field.secure

                // Placeholders padrão baseados no tipo
                const getDefaultPlaceholder = () => {
                    if (field.placeholder) return field.placeholder
                    switch (field.type) {
                        case 'email':
                            return 'exemplo@email.com'
                        case 'password':
                            return '••••••••'
                        case 'number':
                            return '0'
                        default:
                            return ''
                    }
                }

                return (
                    <View key={field.key}>
                        {renderLabel()}
                        <TextInput
                            style={getInputStyle(field.key === 'description' ? styles.inputDescription : styles.input)}
                            value={form[field.key] || ''}
                            placeholder={getDefaultPlaceholder()}
                            placeholderTextColor="#999"
                            secureTextEntry={secure}
                            keyboardType={keyboardType}
                            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
                            autoCorrect={field.type === 'email' || field.type === 'password' ? false : true}
                            onChangeText={(text) =>
                                setForm((prev) => ({ ...prev, [field.key]: text }))
                            }
                        />
                        {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                    </View>
                )

            })}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSubmit}>
                <Text style={styles.buttonText}>{submitLabel}</Text>
            </TouchableOpacity>
            </View>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                date={selectedDate}
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                locale="pt_BR"
            />
        </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

    )
}

const styles = StyleSheet.create({
    container: { 
        padding: 20,
        paddingTop: 130, // Altura do header fixo + padding
    },
    label: { 
        fontSize: 14, 
        marginBottom: 3, 
        marginTop: 12, 
        color: '#333',
        fontWeight: '600',
    },
    required: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    saveButton: {
        backgroundColor: '#3366FF',
        padding: 14,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    cancelText: { color: '#333' },
    cancelButton: {
        backgroundColor: '#eee',
        padding: 14,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#e74c3c',
        borderWidth: 2,
    },
    inputText: {
        color: '#333',
        fontSize: 16,
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#3366FF',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 24,
    },
    buttonSmall: {
        backgroundColor: '#3366FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 12,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    imagePreview: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        marginTop: 10,
    },
    imagePlaceholder: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
        height: 160,
        resizeMode: 'cover',
        borderRadius: 12,
    },
    inputDescription: {
        height: 80,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    }
})

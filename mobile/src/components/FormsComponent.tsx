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
import {useNavigation} from "@react-navigation/native";

type Field = {
    key: string
    label: string
    placeholder?: string
    secure?: boolean
    type?: 'string' | 'number' | 'email' | 'password' | 'date' | 'image' | 'toggle'
    dependsOn?: string // opcional: define de qual campo booleano o campo depende
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
    const navigation = useNavigation()

    const showDatePicker = (key: string) => {
        setActiveDateKey(key)
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
                if (field.type === 'date') {
                    return (
                        <View key={field.key}>
                            <Text style={styles.label}>{field.label}</Text>
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => showDatePicker(field.key)}
                            >
                                <Text>{form[field.key] || 'Selecionar data'}</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                if (field.type === 'image') {
                    return (
                        <View key={field.key} style={{ alignItems: 'center' }}>
                            <Text style={styles.label}>{field.label}</Text>
                            {form[field.key] ? (
                                <Image source={{ uri: form[field.key] }} style={styles.imagePreview} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={{ color: '#888' }}>Nenhuma imagem</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.buttonSmall}
                                onPress={() => handleSelectImage(field.key)}
                            >
                                <Text style={styles.buttonText}>Selecionar Imagem</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                if (field.dependsOn && !form[field.dependsOn]) return null

                if (field.type === 'toggle') {
                    return (
                        <View key={field.key} style={styles.switchRow}>
                            <Text style={styles.label}>{field.label}</Text>
                            <Switch
                                value={!!form[field.key]}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, [field.key]: value }))
                                }
                            />
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

                return (
                    <View key={field.key}>
                        <Text style={styles.label}>{field.label}</Text>
                        <TextInput
                            style={field.key === 'description' ? styles.inputDescription : styles.input}
                            value={form[field.key] || ''}
                            placeholder={field.placeholder}
                            secureTextEntry={secure}
                            keyboardType={keyboardType}
                            onChangeText={(text) =>
                                setForm((prev) => ({ ...prev, [field.key]: text }))
                            }
                        />
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
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                // maximumDate={new Date()}
            />
        </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    label: { fontSize: 14, marginBottom: 3, marginTop: 12, color: '#333' },
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
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: 10,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    inputDescription: {
        height: 80,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
    }
})

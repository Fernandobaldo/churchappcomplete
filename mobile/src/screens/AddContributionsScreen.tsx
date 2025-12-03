import React, { useState } from 'react'
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
    ActivityIndicator,
    Modal,
    Switch,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

interface PaymentMethod {
    id: string
    type: 'PIX' | 'CONTA_BR' | 'IBAN'
    data: Record<string, any>
}

export default function AddContributionScreen() {
    const navigation = useNavigation()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [goal, setGoal] = useState('')
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [isActive, setIsActive] = useState(true)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

    const [showDatePicker, setShowDatePicker] = useState(false)
    const [tempDate, setTempDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentMethodType, setPaymentMethodType] = useState<'PIX' | 'CONTA_BR' | 'IBAN'>('PIX')
    const [paymentData, setPaymentData] = useState<Record<string, string>>({})

    const handleSave = async () => {
        if (!title) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha o título da campanha',
            })
            return
        }

        if (goal && (isNaN(parseFloat(goal)) || parseFloat(goal) <= 0)) {
            Toast.show({
                type: 'error',
                text1: 'Valor inválido',
                text2: 'Por favor, preencha um valor válido maior que zero.',
            })
            return
        }

        try {
            setIsLoading(true)

            const submitData: any = {
                title,
                description: description || undefined,
                isActive,
            }

            if (goal) {
                submitData.goal = parseFloat(goal.replace(',', '.'))
            }

            if (endDate) {
                submitData.endDate = endDate.toISOString()
            }

            if (paymentMethods.length > 0) {
                submitData.paymentMethods = paymentMethods.map(pm => ({
                    type: pm.type,
                    data: pm.data,
                }))
            }

            await api.post('/contributions', submitData)

            Toast.show({
                type: 'success',
                text1: 'Sucesso!',
                text2: 'Campanha criada com sucesso!',
            })

            navigation.goBack()
        } catch (error: any) {
            console.error('Erro ao salvar campanha:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: error.response?.data?.message || 'Ocorreu um erro ao criar a campanha.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const addPaymentMethod = () => {
        const newMethod: PaymentMethod = {
            id: Date.now().toString(),
            type: paymentMethodType,
            data: { ...paymentData },
        }
        setPaymentMethods([...paymentMethods, newMethod])
        setPaymentMethodType('PIX')
        setPaymentData({})
        setShowPaymentModal(false)
    }

    const removePaymentMethod = (id: string) => {
        setPaymentMethods(paymentMethods.filter(m => m.id !== id))
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.form}>
                    <Text style={styles.title}>Nova Campanha de Contribuição</Text>

                    <Text style={styles.label}>
                        Título <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Campanha de Construção"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder="Descrição opcional"
                        placeholderTextColor="#999"
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Meta de Arrecadação</Text>
                    <TextInput
                        style={styles.input}
                        value={goal}
                        onChangeText={setGoal}
                        keyboardType="numeric"
                        placeholder="R$ 0,00"
                        placeholderTextColor="#999"
                    />
                    <Text style={styles.helpText}>
                        Este é o valor objetivo da campanha. O usuário poderá contribuir com qualquer valor.
                    </Text>

                    <Text style={styles.label}>Data de Término</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => {
                            setTempDate(endDate || new Date())
                            setShowDatePicker(true)
                        }}
                    >
                        <Text style={endDate ? styles.inputText : styles.placeholderText}>
                            {endDate ? endDate.toLocaleDateString('pt-BR') : 'Selecione a data (opcional)'}
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
                                        onPress={() => {
                                            setShowDatePicker(false)
                                            setEndDate(null)
                                        }}
                                    >
                                        <Text style={styles.cancelText}>Remover</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowDatePicker(false)}
                                    >
                                        <Text style={styles.cancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={() => {
                                            setEndDate(tempDate)
                                            setShowDatePicker(false)
                                        }}
                                    >
                                        <Text style={styles.saveText}>Confirmar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Text style={styles.label}>Formas de Pagamento</Text>
                    {paymentMethods.map((pm) => (
                        <View key={pm.id} style={styles.paymentMethodItem}>
                            <Text style={styles.paymentMethodText}>
                                {pm.type} - {pm.type === 'PIX' && pm.data.chave}
                                {pm.type === 'CONTA_BR' && `${pm.data.banco} - ${pm.data.agencia}`}
                                {pm.type === 'IBAN' && pm.data.iban}
                            </Text>
                            <TouchableOpacity onPress={() => removePaymentMethod(pm.id)}>
                                <Text style={styles.removeText}>Remover</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={styles.addPaymentButton}
                        onPress={() => setShowPaymentModal(true)}
                    >
                        <Text style={styles.addPaymentText}>+ Adicionar Forma de Pagamento</Text>
                    </TouchableOpacity>

                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Campanha Ativa</Text>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: '#767577', true: '#3366FF' }}
                        />
                    </View>

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
                                <Text style={styles.saveText}>Criar Campanha</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* Modal para adicionar forma de pagamento */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Adicionar Forma de Pagamento</Text>

                        <Text style={styles.label}>Tipo *</Text>
                        <View style={styles.pickerContainer}>
                            <TouchableOpacity
                                style={[styles.pickerOption, paymentMethodType === 'PIX' && styles.pickerOptionActive]}
                                onPress={() => {
                                    setPaymentMethodType('PIX')
                                    setPaymentData({})
                                }}
                            >
                                <Text style={paymentMethodType === 'PIX' ? styles.pickerOptionTextActive : styles.pickerOptionText}>PIX</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pickerOption, paymentMethodType === 'CONTA_BR' && styles.pickerOptionActive]}
                                onPress={() => {
                                    setPaymentMethodType('CONTA_BR')
                                    setPaymentData({})
                                }}
                            >
                                <Text style={paymentMethodType === 'CONTA_BR' ? styles.pickerOptionTextActive : styles.pickerOptionText}>Conta BR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pickerOption, paymentMethodType === 'IBAN' && styles.pickerOptionActive]}
                                onPress={() => {
                                    setPaymentMethodType('IBAN')
                                    setPaymentData({})
                                }}
                            >
                                <Text style={paymentMethodType === 'IBAN' ? styles.pickerOptionTextActive : styles.pickerOptionText}>IBAN</Text>
                            </TouchableOpacity>
                        </View>

                        {paymentMethodType === 'PIX' && (
                            <>
                                <Text style={styles.label}>Chave PIX *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paymentData.chave || ''}
                                    onChangeText={(text) => setPaymentData({ ...paymentData, chave: text })}
                                    placeholder="CPF, Email, Telefone ou Chave Aleatória"
                                    placeholderTextColor="#999"
                                />
                            </>
                        )}

                        {paymentMethodType === 'CONTA_BR' && (
                            <>
                                <Text style={styles.label}>Banco *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paymentData.banco || ''}
                                    onChangeText={(text) => setPaymentData({ ...paymentData, banco: text })}
                                    placeholder="Nome do banco"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.label}>Agência *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paymentData.agencia || ''}
                                    onChangeText={(text) => setPaymentData({ ...paymentData, agencia: text })}
                                    placeholder="0000"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.label}>Conta *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paymentData.conta || ''}
                                    onChangeText={(text) => setPaymentData({ ...paymentData, conta: text })}
                                    placeholder="00000-0"
                                    placeholderTextColor="#999"
                                />
                            </>
                        )}

                        {paymentMethodType === 'IBAN' && (
                            <>
                                <Text style={styles.label}>IBAN *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paymentData.iban || ''}
                                    onChangeText={(text) => setPaymentData({ ...paymentData, iban: text })}
                                    placeholder="GB82 WEST 1234 5698 7654 32"
                                    placeholderTextColor="#999"
                                />
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowPaymentModal(false)
                                    setPaymentData({})
                                }}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, (
                                    (paymentMethodType === 'PIX' && !paymentData.chave) ||
                                    (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                                    (paymentMethodType === 'IBAN' && !paymentData.iban)
                                ) && { opacity: 0.5 }]}
                                onPress={addPaymentMethod}
                                disabled={
                                    (paymentMethodType === 'PIX' && !paymentData.chave) ||
                                    (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                                    (paymentMethodType === 'IBAN' && !paymentData.iban)
                                }
                            >
                                <Text style={styles.saveText}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    form: { padding: 20, flexGrow: 1 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 50 },
    label: { marginTop: 16, marginBottom: 6, fontWeight: '600', color: '#333' },
    required: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        marginTop: -8,
        marginBottom: 10,
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
    inputText: {
        color: '#333',
        fontSize: 16,
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 10,
    },
    paymentMethodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    paymentMethodText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    removeText: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: '600',
    },
    addPaymentButton: {
        borderWidth: 2,
        borderColor: '#3366FF',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    addPaymentText: {
        color: '#3366FF',
        fontSize: 14,
        fontWeight: '600',
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
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    pickerOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
    },
    pickerOptionActive: {
        backgroundColor: '#3366FF',
        borderColor: '#3366FF',
    },
    pickerOptionText: {
        color: '#333',
        fontSize: 14,
    },
    pickerOptionTextActive: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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

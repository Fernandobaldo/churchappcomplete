import React, { useState, useMemo } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent from '../components/FormsComponent'
import TextInputField from '../components/TextInputField'
import GlassCard from '../components/GlassCard'
import GlassFormModal from '../components/GlassFormModal'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import api from '../api/api'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import DateTimePickerComponent from '../components/DateTimePicker'

interface PaymentMethod {
    id: string
    type: 'PIX' | 'CONTA_BR' | 'IBAN'
    data: Record<string, any>
}

export default function AddContributionScreen() {
    const navigation = useNavigation()

    const [form, setForm] = useState({
        title: '',
        description: '',
        goal: '',
        endDate: null as Date | null,
        isActive: true,
    })

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentMethodType, setPaymentMethodType] = useState<'PIX' | 'CONTA_BR' | 'IBAN'>('PIX')
    const [paymentData, setPaymentData] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

    const fields = useMemo(() => [
        { 
            key: 'title', 
            label: 'Título', 
            type: 'string' as const, 
            required: true, 
            placeholder: 'Ex: Campanha de Construção' 
        },
        { 
            key: 'description', 
            label: 'Descrição', 
            type: 'string' as const, 
            placeholder: 'Descrição opcional' 
        },
    ], [])

    const handleSave = async () => {
        if (!form.title) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha o título da campanha',
            })
            return
        }

        if (form.goal && (isNaN(parseFloat(form.goal)) || parseFloat(form.goal) <= 0)) {
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
                title: form.title,
                description: form.description || undefined,
                isActive: form.isActive,
            }

            if (form.goal) {
                submitData.goal = parseFloat(form.goal.replace(',', '.'))
            }

            if (form.endDate) {
                submitData.endDate = form.endDate.toISOString()
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

    const isFormValid = form.title.trim().length > 0

    return (
        <FormScreenLayout
            headerProps={{
                title: "Nova Campanha de Contribuição",
            }}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <FormsComponent
                    form={form}
                    setForm={setForm}
                    fields={fields}
                    onSubmit={() => {}}
                    hideButtons={true}
                />

                <TextInputField
                    fieldKey="goal"
                    label="Meta de Arrecadação"
                    value={form.goal}
                    onChangeText={(text) => setForm((prev: any) => ({ ...prev, goal: text }))}
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                />

                <View style={styles.helpTextContainer}>
                    <Text style={styles.helpText}>
                        Este é o valor objetivo da campanha. O usuário poderá contribuir com qualquer valor.
                    </Text>
                </View>

                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Campanha Ativa</Text>
                    <Switch
                        value={form.isActive}
                        onValueChange={(value) => setForm((prev: any) => ({ ...prev, isActive: value }))}
                        trackColor={{ false: '#767577', true: colors.gradients.primary[1] }}
                    />
                </View>

                <DateTimePickerComponent
                    label="Data de Término"
                    value={form.endDate || undefined}
                    onChange={(value) => {
                        const dateValue = value instanceof Date ? value : (value ? new Date(value) : null)
                        setForm((prev: any) => ({ ...prev, endDate: dateValue }))
                    }}
                    mode="date"
                    placeholder="Selecione a data (opcional)"
                />

                <Text style={styles.sectionLabel}>Formas de Pagamento</Text>
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
                    activeOpacity={0.8}
                >
                    <Text style={styles.addPaymentText}>+ Adicionar Forma de Pagamento</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isLoading || !isFormValid}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={
                                isFormValid && !isLoading
                                    ? colors.gradients.primary as [string, string]
                                    : ['#94A3B8', '#94A3B8']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>Criar Campanha</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal para adicionar forma de pagamento */}
            <GlassFormModal
                visible={showPaymentModal}
                title="Adicionar Forma de Pagamento"
                onClose={() => {
                    setShowPaymentModal(false)
                    setPaymentData({})
                }}
                onSubmit={addPaymentMethod}
                submitLabel="Adicionar"
                position="bottom"
                submitDisabled={
                    (paymentMethodType === 'PIX' && !paymentData.chave) ||
                    (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                    (paymentMethodType === 'IBAN' && !paymentData.iban)
                }
            >
                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.pickerContainer}>
                    <TouchableOpacity
                        style={[styles.pickerOption, paymentMethodType === 'PIX' && styles.pickerOptionActive]}
                        onPress={() => {
                            setPaymentMethodType('PIX')
                            setPaymentData({})
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={paymentMethodType === 'PIX' ? styles.pickerOptionTextActive : styles.pickerOptionText}>PIX</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pickerOption, paymentMethodType === 'CONTA_BR' && styles.pickerOptionActive]}
                        onPress={() => {
                            setPaymentMethodType('CONTA_BR')
                            setPaymentData({})
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={paymentMethodType === 'CONTA_BR' ? styles.pickerOptionTextActive : styles.pickerOptionText}>Conta BR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pickerOption, paymentMethodType === 'IBAN' && styles.pickerOptionActive]}
                        onPress={() => {
                            setPaymentMethodType('IBAN')
                            setPaymentData({})
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={paymentMethodType === 'IBAN' ? styles.pickerOptionTextActive : styles.pickerOptionText}>IBAN</Text>
                    </TouchableOpacity>
                </View>

                {paymentMethodType === 'PIX' && (
                    <TextInputField
                        fieldKey="chave"
                        label="Chave PIX *"
                        value={paymentData.chave || ''}
                        onChangeText={(text) => setPaymentData((prev) => ({ ...prev, chave: text }))}
                        placeholder="CPF, Email, Telefone ou Chave Aleatória"
                        required
                    />
                )}

                {paymentMethodType === 'CONTA_BR' && (
                    <>
                        <TextInputField
                            fieldKey="banco"
                            label="Banco *"
                            value={paymentData.banco || ''}
                            onChangeText={(text) => setPaymentData((prev) => ({ ...prev, banco: text }))}
                            placeholder="Nome do banco"
                            required
                        />
                        <TextInputField
                            fieldKey="agencia"
                            label="Agência *"
                            value={paymentData.agencia || ''}
                            onChangeText={(text) => {
                                // Aceita números, hífen e X (dígito verificador)
                                // Formato: 1234-5 ou 1234-X
                                const allowedText = text.replace(/[^0-9X-]/gi, '').slice(0, 6)
                                setPaymentData((prev) => ({ ...prev, agencia: allowedText }))
                            }}
                            placeholder="1234-5"
                            keyboardType="default"
                            maxLength={6}
                            required
                        />
                        <TextInputField
                            fieldKey="conta"
                            label="Conta *"
                            value={paymentData.conta || ''}
                            onChangeText={(text) => {
                                // Aceita números, hífen e X (dígito verificador)
                                // Formato: 12345678-9 ou 12345678-X
                                const allowedText = text.replace(/[^0-9X-]/gi, '').slice(0, 10)
                                setPaymentData((prev) => ({ ...prev, conta: allowedText }))
                            }}
                            placeholder="12345678-9"
                            keyboardType="default"
                            maxLength={10}
                            required
                        />
                    </>
                )}

                {paymentMethodType === 'IBAN' && (
                    <TextInputField
                        fieldKey="iban"
                        label="IBAN *"
                        value={paymentData.iban || ''}
                        onChangeText={(text) => setPaymentData((prev) => ({ ...prev, iban: text }))}
                        placeholder="GB82 WEST 1234 5698 7654 32"
                        required
                    />
                )}
            </GlassFormModal>
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    helpTextContainer: {
        marginTop: -8,
        marginBottom: 16,
        marginLeft: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: colors.text.primary,
    },
    helpText: {
        fontSize: 12,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: colors.text.primary,
        marginTop: 16,
        marginBottom: 12,
    },
    paymentMethodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.glass.overlay,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    paymentMethodText: {
        flex: 1,
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: '400',
    },
    removeText: {
        color: colors.status.error,
        fontSize: 14,
        fontWeight: '600',
    },
    addPaymentButton: {
        borderWidth: 2,
        borderColor: colors.gradients.primary[1],
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    addPaymentText: {
        color: colors.gradients.primary[1],
        fontSize: 14,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.glass.overlay,
        padding: 16,
        borderRadius: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    cancelText: { 
        color: colors.text.primary, 
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    saveButton: {
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    saveText: { 
        color: '#FFFFFF', 
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    pickerOption: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glass.border,
        alignItems: 'center',
        backgroundColor: colors.glass.overlay,
    },
    pickerOptionActive: {
        backgroundColor: colors.gradients.primary[1],
        borderColor: colors.gradients.primary[1],
    },
    pickerOptionText: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: '400',
    },
    pickerOptionTextActive: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
})

import React, { useState, useMemo, useEffect } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Switch,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent from '../components/FormsComponent'
import TextInputField from '../components/TextInputField'
import GlassCard from '../components/GlassCard'
import { colors } from '../theme/colors'
import api from '../api/api'
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import DateTimePickerComponent from '../components/DateTimePicker'
import { format } from 'date-fns'
import { contributionsService } from '../services/contributions.service'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

interface PaymentMethod {
    id: string
    type: 'PIX' | 'CONTA_BR' | 'IBAN'
    data: Record<string, any>
}

export default function EditContributionScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params as { id: string }

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
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    useEffect(() => {
        if (id) {
            fetchContribution()
        }
    }, [id])

    const fetchContribution = async () => {
        try {
            setLoadingData(true)
            setError(null)
            const res = await api.get(`/contributions/${id}`)
            const contribution = res.data

            setForm({
                title: contribution.title || '',
                description: contribution.description || '',
                goal: contribution.goal ? contribution.goal.toString() : '',
                endDate: contribution.endDate ? new Date(contribution.endDate) : null,
                isActive: contribution.isActive ?? true,
            })

            if (contribution.PaymentMethods && contribution.PaymentMethods.length > 0) {
                const formattedMethods = contribution.PaymentMethods.map((pm: any) => ({
                    id: pm.id,
                    type: pm.type,
                    data: pm.data,
                }))
                setPaymentMethods(formattedMethods)
            }
        } catch (err: any) {
            console.error('Erro ao carregar contribuição:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar os dados da campanha.'
            setError(errorMessage)
        } finally {
            setLoadingData(false)
        }
    }

    const handleRetry = async () => {
        await fetchContribution()
    }

    const handleDelete = async () => {
        Alert.alert(
            'Excluir Contribuição',
            'Tem certeza que deseja excluir esta contribuição? Esta ação não pode ser desfeita.',
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
                            await contributionsService.delete(id)
                            Toast.show({
                                type: 'success',
                                text1: 'Contribuição excluída!',
                                text2: 'A contribuição foi excluída com sucesso.',
                            })
                            // Reset para Main (TabNavigator) com tab Contribuições selecionada
                            // Isso limpa o histórico e mantém o navbar visível
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: 'Main',
                                            state: {
                                                routes: [{ name: 'Contribuições' }],
                                            },
                                        },
                                    ],
                                })
                            )
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Erro ao excluir contribuição',
                                text2: error?.response?.data?.message || 'Houve um erro ao excluir a contribuição.',
                            })
                            console.error('Erro ao excluir contribuição:', error)
                        }
                    },
                },
            ]
        )
    }

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
            } else {
                // Se não houver métodos de pagamento, envia array vazio para remover todos
                submitData.paymentMethods = []
            }

            await api.put(`/contributions/${id}`, submitData)

            Toast.show({
                type: 'success',
                text1: 'Sucesso!',
                text2: 'Campanha atualizada com sucesso!',
            })

            navigation.goBack()
        } catch (error: any) {
            console.error('Erro ao salvar campanha:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: error.response?.data?.message || 'Ocorreu um erro ao atualizar a campanha.',
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
                title: "Editar Campanha de Contribuição",
            }}
            loading={loadingData}
            error={error}
            onRetry={handleRetry}
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
                                <Text style={styles.saveText}>Salvar Alterações</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal para adicionar forma de pagamento */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowPaymentModal(false)
                    setPaymentData({})
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalOverlayInner}>
                        <GlassCard opacity={0.45} blurIntensity={25} borderRadius={20} style={styles.modalContent}>
                            <ScrollView 
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                            <Text style={styles.modalTitle}>Adicionar Forma de Pagamento</Text>

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

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => {
                                        setShowPaymentModal(false)
                                        setPaymentData({})
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={addPaymentMethod}
                                    disabled={
                                        (paymentMethodType === 'PIX' && !paymentData.chave) ||
                                        (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                                        (paymentMethodType === 'IBAN' && !paymentData.iban)
                                    }
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={
                                            (paymentMethodType === 'PIX' && !paymentData.chave) ||
                                            (paymentMethodType === 'CONTA_BR' && (!paymentData.banco || !paymentData.agencia || !paymentData.conta)) ||
                                            (paymentMethodType === 'IBAN' && !paymentData.iban)
                                                ? ['#94A3B8', '#94A3B8'] 
                                                : colors.gradients.primary as [string, string]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.modalSaveButtonGradient}
                                    >
                                        <Text style={styles.modalSaveText}>Adicionar</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </GlassCard>
                </View>
            </KeyboardAvoidingView>
        </Modal>
            
            <View style={styles.deleteContainer}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                >
                    <FontAwesome5 name="trash" size={16} color="#fff" />
                    <Text style={styles.deleteButtonText}>Excluir Contribuição</Text>
                </TouchableOpacity>
            </View>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalOverlayInner: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: 300,
        overflow: 'hidden',
        width: '100%',
    },
    modalScrollView: {
        maxHeight: '100%',
    },
    modalScrollContent: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        color: colors.text.primary,
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
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 10,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: colors.glass.overlay,
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    modalCancelText: { 
        color: colors.text.primary, 
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    modalSaveButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalSaveButtonGradient: {
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    modalSaveText: { 
        color: '#FFFFFF', 
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
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


import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native'
import ModalSelector from 'react-native-modal-selector'
import api from '../api/api'
import Toast from 'react-native-toast-message'

interface Member {
    id: string
    name: string
    email?: string
}

export default function AddTransactionScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY')
    const [entryType, setEntryType] = useState<'OFERTA' | 'DIZIMO' | ''>('')
    const [category, setCategory] = useState('')
    const [isTithePayerMember, setIsTithePayerMember] = useState(true)
    const [tithePayerMemberId, setTithePayerMemberId] = useState<string | null>(null)
    const [tithePayerName, setTithePayerName] = useState('')
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (entryType === 'DIZIMO' && isTithePayerMember) {
            fetchMembers()
        }
    }, [entryType, isTithePayerMember])

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members')
            setMembers(res.data || [])
        } catch (error) {
            console.error('Erro ao buscar membros:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro ao buscar membros',
            })
        }
    }

    const handleSubmit = async () => {
        if (!title || !amount) {
            Alert.alert('Erro', 'Preencha título e valor')
            return
        }

        if (type === 'ENTRY' && !entryType) {
            Alert.alert('Erro', 'Selecione o tipo de entrada (Ofertas ou Dízimo)')
            return
        }

        if (entryType === 'DIZIMO') {
            if (isTithePayerMember && !tithePayerMemberId) {
                Alert.alert('Erro', 'Selecione o membro dizimista')
                return
            }
            if (!isTithePayerMember && !tithePayerName.trim()) {
                Alert.alert('Erro', 'Digite o nome do dizimista')
                return
            }
        }

        setLoading(true)
        try {
            const payload: any = {
                title,
                amount: parseFloat(amount),
                type,
                category: category || undefined,
            }

            if (type === 'ENTRY') {
                payload.entryType = entryType
            }

            if (entryType === 'DIZIMO') {
                if (isTithePayerMember) {
                    payload.tithePayerMemberId = tithePayerMemberId
                    payload.isTithePayerMember = true
                } else {
                    payload.tithePayerName = tithePayerName
                    payload.isTithePayerMember = false
                }
            }

            await api.post('/finances', payload)
            Toast.show({
                type: 'success',
                text1: 'Transação adicionada com sucesso!',
            })
            navigation.goBack()
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Erro ao adicionar transação'
            Toast.show({
                type: 'error',
                text1: errorMessage,
            })
            console.error('Erro ao adicionar transação:', error)
        } finally {
            setLoading(false)
        }
    }

    const memberOptions = members.map((member) => ({
        key: member.id,
        label: member.name,
        value: member,
    }))

    const handleTypeChange = (newType: 'ENTRY' | 'EXIT') => {
        setType(newType)
        if (newType === 'EXIT') {
            setEntryType('')
            setIsTithePayerMember(true)
            setTithePayerMemberId(null)
            setTithePayerName('')
            setSelectedMember(null)
        }
    }

    const handleEntryTypeChange = (newEntryType: 'OFERTA' | 'DIZIMO') => {
        setEntryType(newEntryType)
        if (newEntryType === 'OFERTA') {
            setIsTithePayerMember(true)
            setTithePayerMemberId(null)
            setTithePayerName('')
            setSelectedMember(null)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.label}>Título *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Pagamento de aluguel"
                    />

                    <Text style={styles.label}>Valor *</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                    />

                    <Text style={styles.label}>Tipo *</Text>
                    <View style={styles.typeButtons}>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'ENTRY' && styles.typeButtonActive]}
                            onPress={() => handleTypeChange('ENTRY')}
                        >
                            <Text style={[styles.typeButtonText, type === 'ENTRY' && styles.typeButtonTextActive]}>
                                Entrada
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'EXIT' && styles.typeButtonActive]}
                            onPress={() => handleTypeChange('EXIT')}
                        >
                            <Text style={[styles.typeButtonText, type === 'EXIT' && styles.typeButtonTextActive]}>
                                Saída
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {type === 'ENTRY' && (
                        <>
                            <Text style={styles.label}>Tipo de Entrada *</Text>
                            <ModalSelector
                                data={[
                                    { key: 'OFERTA', label: 'Ofertas' },
                                    { key: 'DIZIMO', label: 'Dízimo' },
                                ]}
                                initValue={entryType === 'OFERTA' ? 'Ofertas' : entryType === 'DIZIMO' ? 'Dízimo' : 'Selecione...'}
                                onChange={(option) => handleEntryTypeChange(option.key as 'OFERTA' | 'DIZIMO')}
                            >
                                <TextInput
                                    style={styles.input}
                                    editable={false}
                                    placeholder="Selecione o tipo de entrada"
                                    value={entryType === 'OFERTA' ? 'Ofertas' : entryType === 'DIZIMO' ? 'Dízimo' : ''}
                                />
                            </ModalSelector>

                            {entryType === 'DIZIMO' && (
                                <>
                                    <View style={styles.switchContainer}>
                                        <Text style={styles.label}>O dizimista é membro</Text>
                                        <Switch
                                            value={isTithePayerMember}
                                            onValueChange={(value) => {
                                                setIsTithePayerMember(value)
                                                if (!value) {
                                                    setTithePayerMemberId(null)
                                                    setSelectedMember(null)
                                                } else {
                                                    setTithePayerName('')
                                                }
                                            }}
                                        />
                                    </View>

                                    {isTithePayerMember ? (
                                        <>
                                            <Text style={styles.label}>Dizimista (Membro) *</Text>
                                            <ModalSelector
                                                data={memberOptions}
                                                initValue={selectedMember?.name || 'Selecione o membro...'}
                                                onChange={(option) => {
                                                    const member = option.value as Member
                                                    setSelectedMember(member)
                                                    setTithePayerMemberId(member.id)
                                                }}
                                            >
                                                <TextInput
                                                    style={styles.input}
                                                    editable={false}
                                                    placeholder="Buscar membro dizimista..."
                                                    value={selectedMember?.name || ''}
                                                />
                                            </ModalSelector>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.label}>Nome do Dizimista *</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={tithePayerName}
                                                onChangeText={setTithePayerName}
                                                placeholder="Digite o nome do dizimista"
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    <Text style={styles.label}>Categoria</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="Ex: Aluguel, Salário, Material, etc."
                    />
                    <Text style={styles.hint}>Opcional - Categoria da transação</Text>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Salvando...' : 'Salvar Transação'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    typeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: -12,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
